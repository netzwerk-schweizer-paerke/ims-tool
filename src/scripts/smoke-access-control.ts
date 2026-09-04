import { z } from 'zod'

// Run this against a local dev server. `before` asserts the current behaviour.
// `after` asserts the fixed behaviour. A row marked INVARIANT expects the same
// result in both modes, so those rows are the regression guard.

// Every response field the test reads. A schema both verifies the payload and types
// it, so a shape change fails the run instead of reading as undefined.
const relationSchema = z.union([z.number(), z.object({ id: z.number() })]).nullish()

const membershipSchema = z.object({
  organisation: z.union([z.number(), z.object({ id: z.number() })]),
})

const userSchema = z.object({
  id: z.number(),
  organisations: z.array(membershipSchema).nullish(),
  selectedOrganisation: relationSchema,
})

const listSchema = z.object({
  docs: z.array(z.object({ id: z.number() })),
  totalDocs: z.number(),
})

const createdSchema = z.object({
  doc: z.object({ id: z.number(), organisation: relationSchema }),
})

const meSchema = z.object({ user: userSchema.nullish() })

const loginSchema = z.object({ user: userSchema })

const describedSchema = z.object({ description: z.string().nullish(), id: z.number() })

const describedListSchema = z.object({ docs: z.array(describedSchema) })

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? 'admin@test.com'
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? 'admin'
const API = `${BASE_URL}/api`

const PARK_USER = { email: 'smoke-park-user@example.invalid', password: 'SmokePw12345!' }
const PARK_ADMIN = { email: 'smoke-park-admin@example.invalid', password: 'SmokePw12345!' }

type Check = {
  actual: string
  after: string
  before: string
  kind: Kind
  name: string
}

type Kind = 'FIX' | 'INVARIANT'

type Mode = 'after' | 'before'

// Raise this with every row added. The run fails when it records a different number.
const EXPECTED_CHECKS = 34

const checks: Check[] = []
const sessionCookie: Record<string, string> = {}

const record = (kind: Kind, name: string, before: string, after: string, actual: string) => {
  checks.push({ actual, after, before, kind, name })
}

// Returns null when the payload does not match. A caller that needs the value then
// records a miss, which fails the row rather than reading as undefined.
const parse = <T>(schema: z.ZodType<T>, value: unknown): null | T => {
  const result = schema.safeParse(value)
  return result.success ? result.data : null
}

const relationId = (value: unknown): null | number => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: number }).id
  return null
}

const request = async (
  path: string,
  init: { as?: string; body?: unknown; method?: string } = {},
): Promise<{ json: unknown; status: number }> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (init.as && sessionCookie[init.as]) headers.cookie = sessionCookie[init.as]

  const response = await fetch(`${API}${path}`, {
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    headers,
    method: init.method ?? 'GET',
  })

  const json = await response.json().catch(() => null)
  return { json, status: response.status }
}

const login = async (
  as: string,
  email: string,
  password: string,
): Promise<null | z.infer<typeof userSchema>> => {
  const response = await fetch(`${API}/users/login`, {
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  if (response.status !== 200) return null
  sessionCookie[as] = (response.headers.get('set-cookie') ?? '').split(';', 1)[0]
  const body: unknown = await response.json()
  return parse(loginSchema, body)?.user ?? null
}

const totalDocs = async (as: string, collection: string): Promise<number> => {
  const { json } = await request(`/${collection}?limit=1&depth=0`, { as })
  return parse(listSchema, json)?.totalDocs ?? -1
}

const docsOf = async (path: string, as: string): Promise<{ id: number }[]> => {
  const { json } = await request(path, { as })
  return parse(listSchema, json)?.docs ?? []
}

const moreThanZero = (count: number): string => (count > 0 ? 'more than 0' : String(count))

// A denied read answers 403. Payload does not return an empty page for `access: false`.
const readOutcome = async (as: string, collection: string): Promise<string> => {
  const { json, status } = await request(`/${collection}?limit=1&depth=0`, { as })
  if (status !== 200) return String(status)
  return moreThanZero(parse(listSchema, json)?.totalDocs ?? -1)
}

const run = async (mode: Mode) => {
  if (!BASE_URL.includes('localhost') && !process.env.SMOKE_ALLOW_REMOTE) {
    throw new Error(`Refusing to write to ${BASE_URL}. Set SMOKE_ALLOW_REMOTE to override.`)
  }

  const admin = await login('admin', ADMIN_EMAIL, ADMIN_PASSWORD)
  if (!admin) {
    throw new Error(
      `Cannot log in as ${ADMIN_EMAIL}. Set SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD.`,
    )
  }

  // A super admin reads every park only while no park is selected. Clear the
  // selection for the discovery pass, and restore it in the finally block.
  const adminOrg = relationId(admin.selectedOrganisation)
  await request(`/users/${admin.id}`, {
    as: 'admin',
    body: { selectedOrganisation: null },
    method: 'PATCH',
  })

  // Pick a home park with content, a second park the same user also belongs to,
  // and a third park nobody in this test belongs to.
  const orgs = await docsOf('/organisations?limit=0&depth=0', 'admin')
  if (orgs.length < 3) throw new Error('The smoke test needs at least three organisations.')

  const withContent: number[] = []
  for (const org of orgs) {
    const { json } = await request(
      `/activities?limit=1&depth=0&where[organisation][equals]=${org.id}`,
      { as: 'admin' },
    )
    if ((parse(listSchema, json)?.totalDocs ?? 0) > 0) withContent.push(org.id)
    if (withContent.length === 3) break
  }
  if (withContent.length < 3) {
    throw new Error('The smoke test needs three parks that hold activities.')
  }

  const [homeOrg, secondOrg, foreignOrg] = withContent
  console.log(`home park ${homeOrg}, second park ${secondOrg}, foreign park ${foreignOrg}\n`)

  let parkUserId: null | number = null
  let parkAdminId: null | number = null
  let createdActivityId: null | number = null
  let createdShareLinkId: null | number = null
  // Read while the admin can still see across parks. A later query ANDs with the selected park.
  let foreignFlowId: null | number = null

  try {
    // ---- fixtures -------------------------------------------------------
    const userDoc = await request('/users', {
      as: 'admin',
      body: {
        ...PARK_USER,
        organisations: [{ organisation: homeOrg, roles: ['user'] }],
        roles: ['user'],
      },
      method: 'POST',
    })
    parkUserId = parse(createdSchema, userDoc.json)?.doc.id ?? null

    const adminDoc = await request('/users', {
      as: 'admin',
      body: {
        ...PARK_ADMIN,
        organisations: [
          { organisation: homeOrg, roles: ['admin'] },
          { organisation: secondOrg, roles: ['admin'] },
        ],
        roles: ['user'],
      },
      method: 'POST',
    })
    parkAdminId = parse(createdSchema, adminDoc.json)?.doc.id ?? null

    if (!parkUserId || !parkAdminId) throw new Error('Could not create the fixture users.')

    const parkUser = await login('user', PARK_USER.email, PARK_USER.password)
    const parkAdmin = await login('padmin', PARK_ADMIN.email, PARK_ADMIN.password)
    if (!parkUser || !parkAdmin) throw new Error('Could not log in as the fixture users.')

    // ---- INVARIANT: the login hook selects a park -------------------------
    const meUser = await request('/users/me?depth=0', { as: 'user' })
    const storedUser = await request(`/users/${parkUserId}?depth=0`, { as: 'admin' })
    record(
      'INVARIANT',
      'afterLogin selects a park for a new user',
      'a park is stored',
      'a park is stored',
      relationId(parse(userSchema, storedUser.json)?.selectedOrganisation) === homeOrg
        ? 'a park is stored'
        : 'no park is stored',
    )
    record('INVARIANT', '/users/me answers for a park user', '200', '200', String(meUser.status))

    // ---- INVARIANT: the park boundary the app relies on --------------------
    const visibleOrgs = await docsOf('/organisations?limit=0&depth=0', 'user')
    record(
      'INVARIANT',
      'a park user lists only their own parks',
      `[${homeOrg}]`,
      `[${homeOrg}]`,
      `[${visibleOrgs.map((org) => org.id).join(',')}]`,
    )

    const ownActivities = await totalDocs('user', 'activities')
    record(
      'INVARIANT',
      'a park user reads their own park',
      'more than 0',
      'more than 0',
      moreThanZero(ownActivities),
    )

    // ---- INVARIANT: a park admin still writes -----------------------------
    const created = await request('/activities', {
      as: 'padmin',
      body: { name: 'SMOKE TEST — delete me', variant: 'standard' },
      method: 'POST',
    })
    const createdActivity = parse(createdSchema, created.json)
    createdActivityId = createdActivity?.doc.id ?? null
    if (created.status !== 201) {
      console.error(`activity create failed: ${JSON.stringify(created.json).slice(0, 400)}\n`)
    }
    record(
      'INVARIANT',
      'a park admin creates an activity in their own park',
      '201',
      '201',
      String(created.status),
    )
    record(
      'INVARIANT',
      'the new activity carries the park of the creator',
      String(homeOrg),
      String(homeOrg),
      String(relationId(createdActivity?.doc.organisation)),
    )

    if (createdActivityId) {
      const updated = await request(`/activities/${createdActivityId}`, {
        as: 'padmin',
        body: { name: 'SMOKE TEST — updated' },
        method: 'PATCH',
      })
      record('INVARIANT', 'a park admin updates their own activity', '200', '200', String(updated.status))
    }

    // ---- INVARIANT: a park user stays read-only ---------------------------
    const userCreate = await request('/activities', {
      as: 'user',
      body: { name: 'SMOKE TEST — should fail', variant: 'standard' },
      method: 'POST',
    })
    record(
      'INVARIANT',
      'a park user cannot create an activity',
      '403',
      '403',
      String(userCreate.status),
    )

    // ---- INVARIANT: a legitimate park switch still works ------------------
    const legalSwitch = await request(`/users/${parkAdminId}`, {
      as: 'padmin',
      body: { selectedOrganisation: secondOrg },
      method: 'PATCH',
    })
    const afterSwitch = await totalDocs('padmin', 'activities')
    record(
      'INVARIANT',
      'a park admin switches to a park they belong to',
      '200',
      '200',
      String(legalSwitch.status),
    )
    record(
      'INVARIANT',
      'the switch shows the content of the second park',
      'more than 0',
      'more than 0',
      moreThanZero(afterSwitch),
    )
    await request(`/users/${parkAdminId}`, {
      as: 'padmin',
      body: { selectedOrganisation: homeOrg },
      method: 'PATCH',
    })

    // ---- INVARIANT: a super admin is unaffected ---------------------------
    const adminOrgs = await docsOf('/organisations?limit=0&depth=0', 'admin')
    record(
      'INVARIANT',
      'a super admin lists every park',
      String(orgs.length),
      String(orgs.length),
      String(adminOrgs.length),
    )

    // ---- INVARIANT: anonymous account creation stays closed ---------------
    const anonCreate = await request('/users', {
      body: { email: 'smoke-anon@example.invalid', password: 'SmokePw12345!', roles: ['admin'] },
      method: 'POST',
    })
    // Before the fix a required `roles` field blocked this by accident, at validation.
    // Now the collection denies it at access control.
    record(
      'FIX',
      'M2 an anonymous user cannot create an account',
      '400',
      '403',
      String(anonCreate.status),
    )
    const userCreateByPark = await request('/users', {
      as: 'padmin',
      body: { email: 'smoke-by-park@example.invalid', password: 'SmokePw12345!', roles: ['user'] },
      method: 'POST',
    })
    record(
      'FIX',
      'M2 a park admin cannot create an account',
      '400',
      '403',
      String(userCreateByPark.status),
    )

    // ---- FIX C2: the park boundary ----------------------------------------
    const illegalSwitch = await request(`/users/${parkUserId}`, {
      as: 'user',
      body: { selectedOrganisation: foreignOrg },
      method: 'PATCH',
    })
    record(
      'FIX',
      'C2 a park user cannot select a foreign park',
      '200',
      '403',
      String(illegalSwitch.status),
    )

    // The load-bearing case: forge a membership and select it in one request. The guard
    // must read the memberships from the stored document, never from the request body.
    const forged = await request(`/users/${parkUserId}`, {
      as: 'user',
      body: {
        organisations: [{ organisation: foreignOrg, roles: ['admin'] }],
        selectedOrganisation: foreignOrg,
      },
      method: 'PATCH',
    })
    const afterForge = await request(`/users/${parkUserId}?depth=0`, { as: 'admin' })
    record(
      'FIX',
      'C2 a forged membership plus a switch is rejected',
      '200',
      '403',
      String(forged.status),
    )
    record(
      'INVARIANT',
      'a park user cannot write their own memberships',
      `[${homeOrg}]`,
      `[${homeOrg}]`,
      `[${(parse(userSchema, afterForge.json)?.organisations ?? [])
        .map((membership) => relationId(membership.organisation))
        .join(',')}]`,
    )

    // Even a super admin cannot strand a park user. The write moves the selection back
    // to a park the user belongs to, so no session ever reads a park it has left.
    await request(`/users/${parkUserId}`, {
      as: 'admin',
      body: { selectedOrganisation: foreignOrg },
      method: 'PATCH',
    })
    const forced = await request(`/users/${parkUserId}?depth=0`, { as: 'admin' })
    record(
      'FIX',
      'C2 a forced foreign park is corrected on write',
      String(foreignOrg),
      String(homeOrg),
      String(relationId(parse(userSchema, forced.json)?.selectedOrganisation)),
    )
    record(
      'INVARIANT',
      'C2 the park user still reads only their own park',
      'more than 0',
      'more than 0',
      await readOutcome('user', 'activities'),
    )

    // A revoked membership must not strand a live session either.
    await request(`/users/${parkUserId}`, {
      as: 'admin',
      body: { organisations: [{ organisation: secondOrg, roles: ['user'] }] },
      method: 'PATCH',
    })
    const revoked = await request(`/users/${parkUserId}?depth=0`, { as: 'admin' })
    record(
      'FIX',
      'C2 a revoked membership moves the selection',
      String(homeOrg),
      String(secondOrg),
      String(relationId(parse(userSchema, revoked.json)?.selectedOrganisation)),
    )
    record(
      'INVARIANT',
      'a park user reads content after a membership change',
      'more than 0',
      'more than 0',
      await readOutcome('user', 'activities'),
    )

    // Put the park user back, so the remaining checks run from the original state.
    await request(`/users/${parkUserId}`, {
      as: 'admin',
      body: {
        organisations: [{ organisation: homeOrg, roles: ['user'] }],
        selectedOrganisation: homeOrg,
      },
      method: 'PATCH',
    })

    // ---- FIX C3: the translate endpoint ------------------------------------
    const foreignActivities2 = await docsOf(
      `/activities?limit=1&depth=0&where[organisation][equals]=${foreignOrg}`,
      'admin',
    )

    const [foreignFlowDoc] = await docsOf(
      `/task-flows?limit=1&depth=0&where[organisation][equals]=${foreignOrg}`,
      'admin',
    )
    foreignFlowId = foreignFlowDoc?.id ?? null
    const foreignActivity = foreignActivities2[0]

    if (foreignActivity) {
      const translate = await request('/deepltranslate/translate', {
        as: 'user',
        body: {
          collectionSlug: 'activities',
          fromLocale: 'de',
          id: foreignActivity.id,
          includeRelationships: false,
          toLocale: 'fr',
        },
        method: 'POST',
      })
      record(
        'FIX',
        'C3 a park user cannot translate a foreign document',
        'not 403',
        '403',
        translate.status === 403 ? '403' : 'not 403',
      )
    }

    // ---- FIX M1: the unlock operation --------------------------------------
    const unlock = await request('/users/unlock', {
      as: 'user',
      body: { email: ADMIN_EMAIL },
      method: 'POST',
    })
    record('FIX', 'M1 a park user cannot unlock an account', '200', '403', String(unlock.status))

    // ---- FIX H1: who may edit the organisation record ----------------------
    const orgRow = await request(`/organisations/${homeOrg}?depth=0`, { as: 'admin' })
    const orgDescription = parse(describedSchema, orgRow.json)?.description ?? null
    const orgEditByAdmin = await request(`/organisations/${homeOrg}`, {
      as: 'padmin',
      body: { description: 'SMOKE TEST — should fail' },
      method: 'PATCH',
    })
    record(
      'FIX',
      'H1 a park admin cannot edit the organisation',
      '200',
      '403',
      String(orgEditByAdmin.status),
    )
    if (orgEditByAdmin.status === 200) {
      await request(`/organisations/${homeOrg}`, {
        as: 'admin',
        body: { description: orgDescription },
        method: 'PATCH',
      })
    }
    const orgEditBySuperAdmin = await request(`/organisations/${homeOrg}`, {
      as: 'admin',
      body: { description: orgDescription },
      method: 'PATCH',
    })
    record(
      'INVARIANT',
      'a super admin still edits the organisation',
      '200',
      '200',
      String(orgEditBySuperAdmin.status),
    )

    // ---- FIX H3: the legacy document fetcher -------------------------------
    const legacyAsUser = await request('/activities/fetch-legacy-docs', {
      as: 'user',
      body: { dryRun: true },
      method: 'POST',
    })
    record(
      'FIX',
      'H3 a park user cannot run the legacy fetcher',
      'not 403',
      '403',
      legacyAsUser.status === 403 ? '403' : 'not 403',
    )
    const legacyAsAdmin = await request('/activities/fetch-legacy-docs', {
      as: 'padmin',
      body: { dryRun: true },
      method: 'POST',
    })
    record(
      'INVARIANT',
      'a park admin still runs the legacy fetcher',
      'not 403',
      'not 403',
      legacyAsAdmin.status === 403 ? '403' : 'not 403',
    )

    // ---- FIX M3: the document health check ---------------------------------
    const foreignDoc = foreignActivities2[0]
    if (foreignDoc) {
      const healthForeign = await request('/tenant-health', {
        as: 'user',
        body: { collection: 'activities', id: foreignDoc.id },
        method: 'POST',
      })
      record(
        'FIX',
        'M3 a park user cannot health-check a foreign document',
        '200',
        '404',
        String(healthForeign.status),
      )
    }
    const [ownActivity] = await docsOf(`/activities?limit=1&depth=0`, 'user')
    if (ownActivity) {
      const healthOwn = await request('/tenant-health', {
        as: 'user',
        body: { collection: 'activities', id: ownActivity.id },
        method: 'POST',
      })
      record(
        'INVARIANT',
        'a park user still health-checks their own document',
        '200',
        '200',
        String(healthOwn.status),
      )
    }

    // ---- FIX M4: the owner reads their own park ----------------------------
    const meAgain = await request('/users/me?depth=0', { as: 'user' })
    record(
      'FIX',
      // `relationId` returns null for a stripped field, and the row stringifies it.
      'M4 a park user reads their own selectedOrganisation',
      'null',
      String(homeOrg),
      String(relationId(parse(meSchema, meAgain.json)?.user?.selectedOrganisation)),
    )

    // ---- FIX H2: the shared document pool ----------------------------------
    const publicList = await request('/documents-public?limit=1&depth=0', { as: 'user' })
    const [publicDoc] = parse(describedListSchema, publicList.json)?.docs ?? []
    if (publicDoc) {
      const original = publicDoc.description ?? null
      const patch = await request(`/documents-public/${publicDoc.id}`, {
        as: 'user',
        body: { description: 'SMOKE TEST — should fail' },
        method: 'PATCH',
      })
      // The shared pool stays writable by every logged-in user. That is a recorded
      // decision, not an oversight. See decisions/documents-public-stays-open.
      record(
        'INVARIANT',
        'the shared pool stays writable by any member (accepted risk)',
        '200',
        '200',
        String(patch.status),
      )
      if (patch.status === 200) {
        await request(`/documents-public/${publicDoc.id}`, {
          as: 'admin',
          body: { description: original },
          method: 'PATCH',
        })
      }
      const publicVisible = await totalDocs('user', 'documents-public')
      record(
        'INVARIANT',
        'a park user still reads the shared documents',
        'more than 0',
        'more than 0',
        moreThanZero(publicVisible),
      )
    }
    // A member could not share a flow, a block or a list. The hook took `organisation` from a
    // read with `overrideAccess: false`, and that read strips the field for a non-admin.
    // See pitfalls/organisation-field-is-stripped-from-an-access-checked-read.
    const [homeFlow] = await docsOf(
      `/task-flows?where[organisation][equals]=${homeOrg}&limit=1&depth=0`,
      'admin',
    )

    if (homeFlow) {
      const share = await request('/share-links', {
        as: 'user',
        body: { targetType: 'flow', taskFlow: homeFlow.id },
        method: 'POST',
      })

      record('FIX', 'H4 a park user shares a flow of their own park', '403', '201', String(share.status))

      const created = parse(createdSchema, share.json)
      createdShareLinkId = created?.doc.id ?? null

      record(
        'FIX',
        'H4 the share link carries the park of the creator',
        'no link',
        String(homeOrg),
        String(relationId(created?.doc.organisation) ?? 'none'),
      )
    }

    if (foreignFlowId) {
      const foreignShare = await request('/share-links', {
        as: 'user',
        body: { targetType: 'flow', taskFlow: foreignFlowId },
        method: 'POST',
      })

      record(
        'INVARIANT',
        'a park user cannot share a flow of a foreign park',
        '403',
        '403',
        String(foreignShare.status),
      )
    }
  } finally {
    if (createdShareLinkId) {
      await request(`/share-links/${createdShareLinkId}`, { as: 'admin', method: 'DELETE' })
    }
    if (createdActivityId) {
      await request(`/activities/${createdActivityId}`, { as: 'admin', method: 'DELETE' })
    }
    if (parkUserId) await request(`/users/${parkUserId}`, { as: 'admin', method: 'DELETE' })
    if (parkAdminId) await request(`/users/${parkAdminId}`, { as: 'admin', method: 'DELETE' })

    await request(`/users/${admin.id}`, {
      as: 'admin',
      body: { selectedOrganisation: adminOrg },
      method: 'PATCH',
    })

    const leftover = await docsOf(
      '/users?limit=5&depth=0&where[email][like]=example.invalid',
      'admin',
    )
    if (leftover.length > 0) {
      console.error(`\nWARNING: ${leftover.length} fixture users remain. Delete them by hand.`)
    }
  }

  // ---- report ------------------------------------------------------------
  let failed = 0
  const width = Math.max(...checks.map((c) => c.name.length))

  for (const check of checks) {
    const expected = mode === 'before' ? check.before : check.after
    const ok = check.actual === expected
    if (!ok) failed++
    const status = ok ? 'PASS' : 'FAIL'
    const detail = ok ? expected : `expected ${expected}, got ${check.actual}`
    console.log(`${status}  ${check.kind.padEnd(9)} ${check.name.padEnd(width)}  ${detail}`)
  }

  console.log(`\n${checks.length - failed}/${checks.length} passed in mode "${mode}".`)

  // Several rows only record when a lookup returned a document. Without this the run
  // prints a clean pass over a shrunken denominator, and a missing control reads as success.
  if (checks.length !== EXPECTED_CHECKS) {
    console.error(
      `\nFAIL  the run recorded ${checks.length} checks, and ${EXPECTED_CHECKS} are expected.` +
        ' A lookup returned no document, so an assertion never ran.',
    )
    failed++
  }

  if (failed > 0) process.exitCode = 1
}

const mode = (process.argv[2] ?? 'after') as Mode
if (mode !== 'before' && mode !== 'after') {
  throw new Error('Usage: yarn smoke:access [before|after]')
}

await run(mode)
