import type { CollectionBeforeChangeHook, PayloadRequest } from 'payload'

import { describe, expect, type Mock, test, vi } from 'vitest'

// `checkUserRoles` imports tslog. The stub keeps the logger out of the run.
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

// The hook imports `APIError` at run time. The stub keeps the message and the status, which is
// what the tests assert, and it keeps the whole payload package out of the run.
vi.mock('payload', () => ({
  APIError: class extends Error {
    status: number

    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

import { User } from '@/payload-types'
import { stampShareLinkHook } from '@/payload/collections/ShareLinks/hooks/stamp-share-link-hook'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { createMockUser, mockOrganisations } from '@/tests/mocks/test-utils'

const PARK = mockOrganisations.org1.id
const OTHER_PARK = mockOrganisations.org2.id

type HookArgs = Parameters<CollectionBeforeChangeHook>[0]
type HookResult = Record<string, unknown>
type Reads = { find: Mock; findByID: Mock }

const member: User = {
  ...createMockUser({ id: 9, selectedOrganisation: mockOrganisations.org1 }),
  organisations: [{ organisation: PARK, roles: [ROLE_USER] }],
}

const makeReq = (user: null | User, reads: Reads): PayloadRequest =>
  ({ payload: reads, user }) as unknown as PayloadRequest

const callHook = async (
  data: Record<string, unknown>,
  req: PayloadRequest,
  operation: 'create' | 'update' = 'create',
): Promise<HookResult> =>
  (await stampShareLinkHook({
    context: {},
    data,
    operation,
    req,
  } as unknown as HookArgs)) as HookResult

const noReads = (): Reads => ({
  find: vi.fn().mockResolvedValue({ docs: [] }),
  findByID: vi.fn().mockResolvedValue(null),
})

/**
 * The two answers a real Payload gives for one row. The access-checked read strips
 * `organisation` for a `ROLE_USER`, because the field's read rule grants only an admin. The
 * override read returns the whole row.
 */
const readsOf = (id: number, organisation: number): Reads => ({
  find: vi.fn().mockResolvedValue({ docs: [{ id }] }),
  findByID: vi.fn().mockResolvedValue({ id, organisation }),
})

describe('stampShareLinkHook', () => {
  test('leaves an update untouched', async () => {
    const reads = noReads()
    const data = { targetType: 'flow', taskFlow: 42 }

    expect(await callHook(data, makeReq(member, reads), 'update')).toBe(data)
    expect(reads.find).not.toHaveBeenCalled()
    expect(reads.findByID).not.toHaveBeenCalled()
  })

  test('refuses a create with no authenticated user', async () => {
    await expect(
      callHook({ targetType: 'flow', taskFlow: 42 }, makeReq(null, noReads())),
    ).rejects.toMatchObject({ message: expect.stringContaining('authenticated creator'), status: 401 })
  })

  test('refuses a target that names no page', async () => {
    await expect(
      callHook({ targetType: 'flow' }, makeReq(member, noReads())),
    ).rejects.toMatchObject({ status: 400 })
  })

  test('refuses a target the caller cannot read, and never runs the override read', async () => {
    const reads = noReads()

    await expect(
      callHook({ targetType: 'flow', taskFlow: 42 }, makeReq(member, reads)),
    ).rejects.toMatchObject({ status: 403 })
    expect(reads.findByID).not.toHaveBeenCalled()
  })

  test('proves the caller may read the target with the caller access, never with an override', async () => {
    const reads = readsOf(42, PARK)

    await callHook({ targetType: 'flow', taskFlow: 42 }, makeReq(member, reads))

    expect(reads.find).toHaveBeenCalledTimes(1)
    expect(reads.find.mock.calls[0][0]).toMatchObject({
      collection: 'task-flows',
      depth: 0,
      disableErrors: true,
      limit: 1,
      overrideAccess: false,
      user: member,
      where: { id: { equals: 42 } },
    })
  })

  test('reads the organisation with an override after the caller access passed', async () => {
    const reads = readsOf(42, PARK)
    const req = makeReq(member, reads)

    await callHook({ targetType: 'flow', taskFlow: 42 }, req)

    expect(reads.findByID).toHaveBeenCalledTimes(1)
    expect(reads.findByID.mock.calls[0][0]).toMatchObject({
      collection: 'task-flows',
      depth: 0,
      id: 42,
      overrideAccess: true,
      req,
    })
  })

  test.each([
    ['flow', 'task-flows', { targetType: 'flow', taskFlow: 42 }],
    ['block', 'activities', { activity: 12, blockId: 'block-1', targetType: 'activityBlock' }],
    ['list', 'task-lists', { targetType: 'list', taskList: 7 }],
  ])(
    'lets a ROLE_USER member of the park share a %s although the caller read strips the organisation',
    async (_label, collection, data) => {
      const reads = readsOf(42, PARK)

      const result = await callHook(data, makeReq(member, reads))

      expect(reads.find.mock.calls[0][0]).toMatchObject({ collection })
      expect(reads.findByID.mock.calls[0][0]).toMatchObject({ collection })
      expect(result.organisation).toBe(PARK)
    },
  )

  test('refuses a readable target whose park the caller does not belong to', async () => {
    // The override read is bound by an explicit membership check, so a widened collection
    // read rule can never mint a link to another park's page.
    const reads = readsOf(42, OTHER_PARK)

    await expect(
      callHook({ targetType: 'flow', taskFlow: 42 }, makeReq(member, reads)),
    ).rejects.toMatchObject({ status: 403 })
  })

  test('refuses a target that vanished between the two reads', async () => {
    const reads = readsOf(42, PARK)
    reads.findByID.mockResolvedValue(null)

    await expect(
      callHook({ targetType: 'flow', taskFlow: 42 }, makeReq(member, reads)),
    ).rejects.toMatchObject({ status: 403 })
  })

  test('lets a super admin share a flow of the park they selected without a membership', async () => {
    const superAdmin: User = createMockUser({
      id: 1,
      roles: [ROLE_SUPER_ADMIN],
      selectedOrganisation: mockOrganisations.org1,
    })

    const result = await callHook(
      { targetType: 'flow', taskFlow: 42 },
      makeReq(superAdmin, readsOf(42, PARK)),
    )

    expect(result.organisation).toBe(PARK)
  })

  test('stamps the organisation of the resolved record, not one the client sent', async () => {
    const result = await callHook(
      { organisation: OTHER_PARK, targetType: 'flow', taskFlow: 42 },
      makeReq(member, readsOf(42, PARK)),
    )

    expect(result.organisation).toBe(PARK)
  })

  test('stamps the creator from the request, never from the body', async () => {
    const result = await callHook(
      { createdBy: 999, targetType: 'flow', taskFlow: 42 },
      makeReq(member, readsOf(42, PARK)),
    )

    expect(result.createdBy).toBe(9)
  })

  test('replaces a client-supplied token with a generated one', async () => {
    const result = await callHook(
      { targetType: 'flow', taskFlow: 42, token: 'chosen-by-the-client' },
      makeReq(member, readsOf(42, PARK)),
    )

    expect(result.token).not.toBe('chosen-by-the-client')
    expect(result.token).toMatch(/^[\w-]{20,}$/)
  })

  test('generates a different token on every create', async () => {
    const data = { targetType: 'flow', taskFlow: 42 }

    const first = await callHook({ ...data }, makeReq(member, readsOf(42, PARK)))
    const second = await callHook({ ...data }, makeReq(member, readsOf(42, PARK)))

    expect(first.token).not.toBe(second.token)
  })

  test('takes the landscape organisation from a park the caller belongs to', async () => {
    const reads = noReads()

    const result = await callHook({ targetType: 'activityLandscape' }, makeReq(member, reads))

    expect(result.organisation).toBe(PARK)
    expect(reads.find).not.toHaveBeenCalled()
    expect(reads.findByID).not.toHaveBeenCalled()
  })

  test('refuses a landscape link for a park the caller does not belong to', async () => {
    const impostor: User = {
      ...createMockUser({ id: 10, selectedOrganisation: mockOrganisations.org1 }),
      organisations: [{ organisation: OTHER_PARK, roles: [ROLE_USER] }],
    }

    await expect(
      callHook({ targetType: 'activityLandscape' }, makeReq(impostor, noReads())),
    ).rejects.toMatchObject({ status: 403 })
  })

  test('lets a super admin share the landscape of the park they selected', async () => {
    const superAdmin: User = createMockUser({
      id: 1,
      roles: [ROLE_SUPER_ADMIN],
      selectedOrganisation: mockOrganisations.org1,
    })

    const result = await callHook(
      { targetType: 'activityLandscape' },
      makeReq(superAdmin, noReads()),
    )

    expect(result.organisation).toBe(PARK)
  })
})
