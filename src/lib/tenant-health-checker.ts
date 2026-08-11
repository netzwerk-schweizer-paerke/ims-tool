/**
 * Tier 1 tenant data health check.
 *
 * Answers "is this park's data cloneable and intact?" without writing anything.
 * Every check maps to a concrete failure site in the cloning pipeline:
 *
 * - a reference cloning actually follows makes `findByID` throw, aborting the clone (blocking)
 * - a missing required field in the default locale makes `payload.create` throw (blocking)
 * - a broken document reference is swallowed into `addMissingFileError`, so the clone
 *   "succeeds" but silently arrives without the file (degrading)
 *
 * The distinction matters: blocking findings mean the clone fails loudly, degrading
 * findings mean nobody notices until a park opens the copy and the attachment is gone.
 *
 * Findings carry a code plus parameters rather than a prose message — the admin UI runs in
 * four languages, so the wording lives in the translation files.
 */

import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Payload } from 'payload'

import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

/**
 * Collections whose rows belong to exactly one organisation. `documents-public` is
 * deliberately absent — it is shared across parks by design, so an activity in park A
 * referencing a public document is correct, not a leak.
 */
const ORG_SCOPED_COLLECTIONS = new Set(['activities', 'documents', 'task-flows', 'task-lists'])

const S3_PROBE_CONCURRENCY = 8

export interface TenantHealthEntityRef {
  collection: string
  id: number
}

export interface TenantHealthFinding {
  code: TenantHealthFindingCode
  /** Only set for findings specific to one locale. */
  locale?: string
  /** Resolved from `path` — what the UI shows and links to. */
  location?: TenantHealthLocation
  /** Interpolated into the translated message. */
  params: Record<string, number | string>
  /** Dotted path to the offending value inside the source document, when known. */
  path?: string
  /**
   * The other row involved, worth opening alongside the source: the referenced row for a
   * reference finding, or a document's referrer for a file finding.
   */
  related?: TenantHealthEntityRef
  severity: TenantHealthSeverity
  /**
   * The row a user should open to fix this.
   *
   * For a broken reference that is the document *containing* the link, not the row it
   * points at — opening the target would show a perfectly fine record and tell the user
   * nothing about where the bad link lives.
   */
  source: TenantHealthEntityRef
}

export type TenantHealthFindingCode =
  | 'crossOrgReference'
  | 'crossOrgReferenceFollowed'
  | 'danglingReference'
  | 'danglingReferenceFollowed'
  | 'documentIncomplete'
  | 'malformedRichTextNoChildren'
  | 'malformedRichTextRoot'
  | 'missingRequiredField'
  | 'prefixOrganisationMismatch'
  | 's3ObjectMissing'
  | 's3ObjectUnreadable'

/**
 * Where in the source document the problem sits, in terms a user can act on.
 *
 * The raw dotted path (`blocks.de[0].keypoints.keypoints.root.children[0]…`) is accurate but
 * unusable — nobody can find that in the edit view. This resolves it to the block a user can
 * actually scroll to.
 */
export interface TenantHealthLocation {
  /** DOM id in the Payload edit view: `blocks-row-2`, `items-row-0`, or `field-description`. */
  anchor?: string
  /** The array field the row belongs to — `blocks`, `items` or `files`. */
  container?: string
  /** First field segment inside the row, e.g. `keypoints`. */
  field?: string
  locale?: string
  /** 1-based, matching the numbering shown in the admin UI. */
  rowNumber?: number
}

export type TenantHealthPreconditionCode =
  | 'apiKeyInvalid'
  | 'apiKeyMissing'
  | 'apiKeyUnreachable'
  | 's3BucketMissing'
  | 's3Unreachable'

export interface TenantHealthPreconditionResult {
  code?: TenantHealthPreconditionCode
  /** Raw technical detail from the HTTP or S3 layer. Deliberately untranslated. */
  error?: string
  ok: boolean
}

export interface TenantHealthPreconditions {
  /**
   * The clone pipeline downloads every file over HTTP using PAYLOAD_API_KEY. If the key is
   * invalid every document check fails identically, which would render as "every park is
   * broken" — so this is reported separately and suppresses the S3 probes.
   */
  apiKey: TenantHealthPreconditionResult
  s3: TenantHealthPreconditionResult
}

export interface TenantHealthReport {
  checkedAt: string
  counts: {
    activities: number
    documents: number
    taskFlows: number
    taskLists: number
  }
  findings: TenantHealthFinding[]
  organisation: { id: number; name: string }
  preconditions: TenantHealthPreconditions
  summary: {
    blocking: number
    degrading: number
    healthy: boolean
  }
}

export type TenantHealthSeverity = 'blocking' | 'degrading'

interface LoadedEntity {
  [key: string]: unknown
  __collection: string
  id: number
  name?: Record<string, unknown> | string
  variant?: unknown
}

interface RawReference {
  collection: string
  /**
   * Whether cloning actually follows this reference.
   *
   * `cloneActivityBlocks` calls `findByID` on everything under `relations.tasks`, with the
   * caller's access applied — so a broken or foreign row there aborts the whole clone.
   * Every other reference site is either wrapped in a try/catch that degrades to a
   * "missing file" note, or (for a lexical link to anything other than a document) never
   * dereferenced at all. Treating those as blocking would bury the ones that really stop a
   * clone.
   */
  dereferenced: boolean
  id: number
  path: string
}

/** A reference plus the row it was found in, so a finding can point at something openable. */
interface Reference extends RawReference {
  owner: TenantHealthEntityRef
}

interface WalkResult {
  malformedRichText: { code: TenantHealthFindingCode; path: string }[]
  references: RawReference[]
}

export class TenantHealthChecker {
  private readonly bucket: string
  private readonly payload: Payload
  private readonly s3: S3Client

  constructor(payload: Payload) {
    this.payload = payload
    this.bucket = process.env.S3_BUCKET || ''
    this.s3 = new S3Client({
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      // Garage enforces its configured s3_region and rejects a mismatch, unlike MinIO/R2.
      region: process.env.S3_REGION || 'auto',
    })
  }

  async run(organisationId: number): Promise<TenantHealthReport> {
    const organisation = await this.payload.findByID({
      collection: 'organisations',
      depth: 0,
      id: organisationId,
      overrideAccess: true,
    })

    const findings: TenantHealthFinding[] = []
    const preconditions = await this.checkPreconditions()

    // Access control scopes every collection to the *reader's* selected organisation, so
    // without overrideAccess a sweep of any other park silently returns zero rows and
    // reports it as healthy.
    const [activities, taskFlows, taskLists] = await Promise.all([
      this.findAll('activities', organisationId),
      this.findAll('task-flows', organisationId),
      this.findAll('task-lists', organisationId),
    ])

    const analysis = await this.analyse(
      [...activities, ...taskFlows, ...taskLists],
      organisationId,
      preconditions,
    )

    findings.push(...analysis.findings)

    return buildReport({
      counts: {
        // Only this park's own documents. Referenced documents belonging to another
        // organisation are still resolved and reported as cross-org findings, but counting
        // them here would overstate what this park actually owns.
        activities: activities.length,
        documents: analysis.ownedDocumentCount,
        taskFlows: taskFlows.length,
        taskLists: taskLists.length,
      },
      findings,
      organisation: { id: organisationId, name: organisation?.name ?? `#${organisationId}` },
      preconditions,
    })
  }

  /**
   * Checks a single document — the same Tier 1 checks, scoped to one row, so an editor can
   * verify the item in front of them instead of scanning the whole park.
   *
   * Note this reads the *saved* row. Unsaved edits in the open form are not considered.
   */
  async runForDocument(
    collection: 'activities' | 'task-flows' | 'task-lists',
    id: number,
  ): Promise<TenantHealthReport> {
    const entity = (await this.payload.findByID({
      collection,
      depth: 0,
      id,
      locale: 'all',
      overrideAccess: true,
    })) as unknown as LoadedEntity

    const organisationId = Number(getIdFromRelation(entity.organisation as never) ?? 0)
    const organisation = organisationId
      ? await this.payload.findByID({
          collection: 'organisations',
          depth: 0,
          id: organisationId,
          overrideAccess: true,
        })
      : null

    const preconditions = await this.checkPreconditions()
    const analysis = await this.analyse(
      [{ ...entity, __collection: collection }],
      organisationId,
      preconditions,
    )

    return buildReport({
      counts: {
        activities: collection === 'activities' ? 1 : 0,
        documents: analysis.ownedDocumentCount,
        taskFlows: collection === 'task-flows' ? 1 : 0,
        taskLists: collection === 'task-lists' ? 1 : 0,
      },
      findings: analysis.findings,
      organisation: { id: organisationId, name: organisation?.name ?? `#${organisationId}` },
      preconditions,
    })
  }

  /** The shared body of both entry points: walk the given rows and resolve what they point at. */
  private async analyse(
    entities: LoadedEntity[],
    organisationId: number,
    preconditions: TenantHealthPreconditions,
  ): Promise<{ findings: TenantHealthFinding[]; ownedDocumentCount: number }> {
    const findings: TenantHealthFinding[] = []
    const referenced: Reference[] = []

    for (const entity of entities) {
      const source: TenantHealthEntityRef = { collection: entity.__collection, id: entity.id }

      findings.push(...this.checkRequiredFields(entity, source))

      const walk = walkForReferences(entity)
      referenced.push(...walk.references.map((reference) => ({ ...reference, owner: source })))

      for (const issue of walk.malformedRichText) {
        findings.push({
          code: issue.code,
          params: {},
          path: issue.path,
          severity: 'blocking',
          source,
        })
      }
    }

    findings.push(...(await this.checkReferences(referenced, organisationId)))

    const documentRefs = referenced.filter((reference) => reference.collection === 'documents')
    const documentResult = await this.checkDocuments(documentRefs, organisationId, preconditions)
    findings.push(...documentResult.findings)

    return { findings, ownedDocumentCount: documentResult.ownedCount }
  }

  private async checkApiKey(): Promise<TenantHealthPreconditionResult> {
    const apiKey = process.env.PAYLOAD_API_KEY

    if (!apiKey) {
      return { code: 'apiKeyMissing', ok: false }
    }

    const serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'

    try {
      const response = await fetch(`${serverUrl}/api/users/me`, {
        headers: { Authorization: `users API-Key ${apiKey}` },
      })
      const body = (await response.json()) as { user?: unknown }

      return body?.user ? { ok: true } : { code: 'apiKeyInvalid', ok: false }
    } catch (error) {
      return { code: 'apiKeyUnreachable', error: `${serverUrl}: ${describe(error)}`, ok: false }
    }
  }

  /**
   * Documents are only reachable through the clone pipeline if the row is complete, the
   * S3 object exists, and the stored prefix still points at the object that was uploaded.
   */
  private async checkDocuments(
    references: Reference[],
    organisationId: number,
    preconditions: TenantHealthPreconditions,
  ): Promise<{ findings: TenantHealthFinding[]; ownedCount: number }> {
    const documentIds = uniqueIds(references)

    if (documentIds.length === 0) {
      return { findings: [], ownedCount: 0 }
    }

    const findings: TenantHealthFinding[] = []

    // A file finding is fixed on the document itself, but naming a row that references it
    // makes the report navigable from either end.
    const referrerByDocumentId = new Map(
      references.map((reference) => [reference.id, reference.owner]),
    )

    const { docs } = await this.payload.find({
      collection: 'documents',
      depth: 0,
      limit: 0,
      overrideAccess: true,
      where: { id: { in: documentIds } },
    })

    const probeable: { id: number; key: string; related?: TenantHealthEntityRef }[] = []
    let ownedCount = 0

    for (const doc of docs) {
      const source: TenantHealthEntityRef = { collection: 'documents', id: doc.id }
      const related = referrerByDocumentId.get(doc.id)

      const missing = (['filename', 'filesize', 'mimeType', 'url'] as const).filter(
        (field) => !doc[field],
      )

      if (missing.length > 0) {
        findings.push({
          code: 'documentIncomplete',
          params: { fields: missing.join(', ') },
          related,
          severity: 'degrading',
          source,
        })
      }

      const prefix = (doc as { prefix?: null | string }).prefix
      const expected = `documents/${organisationId}`

      // Only judge the layout of documents this park actually owns. A document belonging
      // to another organisation is legitimately stored under that organisation's prefix —
      // the cross-org reference finding already covers why it is referenced from here.
      const ownerId = getIdFromRelation(doc.organisation as never)
      const ownedByCheckedOrg = ownerId !== null && Number(ownerId) === organisationId

      if (ownedByCheckedOrg) {
        ownedCount += 1
      }

      if (ownedByCheckedOrg && prefix && prefix !== expected) {
        findings.push({
          code: 'prefixOrganisationMismatch',
          params: { expected, prefix },
          related,
          severity: 'degrading',
          source,
        })
      }

      // An incomplete row is still worth probing — `url` in particular is regenerated on
      // read, so its absence says nothing about whether the object is there. Only filename
      // and prefix are actually required to build the key.
      if (prefix && doc.filename) {
        probeable.push({ id: doc.id, key: `${prefix}/${doc.filename}`, related })
      }
    }

    if (preconditions.s3.ok) {
      findings.push(...(await this.probeS3(probeable)))
    }

    return { findings, ownedCount }
  }

  private async checkPreconditions(): Promise<TenantHealthPreconditions> {
    const [s3, apiKey] = await Promise.all([this.checkS3(), this.checkApiKey()])
    return { apiKey, s3 }
  }

  /**
   * Resolves every collected reference in one query per collection, then reports the ones
   * that do not exist or belong to another park.
   */
  private async checkReferences(
    references: Reference[],
    organisationId: number,
  ): Promise<TenantHealthFinding[]> {
    const findings: TenantHealthFinding[] = []
    const byCollection = new Map<string, Reference[]>()

    for (const reference of references) {
      const existing = byCollection.get(reference.collection)
      if (existing) {
        existing.push(reference)
      } else {
        byCollection.set(reference.collection, [reference])
      }
    }

    for (const [collection, refs] of byCollection) {
      const ids = uniqueIds(refs)

      let docs: { id: number | string; organisation?: unknown }[] = []

      try {
        const result = await this.payload.find({
          collection: collection as 'activities',
          depth: 0,
          limit: 0,
          overrideAccess: true,
          where: { id: { in: ids } },
        })
        docs = result.docs
      } catch {
        // An unknown collection slug stored in content is itself a defect, but it cannot
        // be resolved — every reference to it is reported as dangling below.
        docs = []
      }

      const foundById = new Map(docs.map((doc) => [Number(doc.id), doc]))

      for (const reference of refs) {
        const found = foundById.get(reference.id)

        if (!found) {
          findings.push({
            code: reference.dereferenced ? 'danglingReferenceFollowed' : 'danglingReference',
            params: { collection, id: reference.id },
            path: reference.path,
            // No `related` — the whole point is that the target row does not exist.
            severity: reference.dereferenced ? 'blocking' : 'degrading',
            source: reference.owner,
          })
          continue
        }

        if (!ORG_SCOPED_COLLECTIONS.has(collection)) {
          continue
        }

        const ownerId = getIdFromRelation(found.organisation as never)

        if (ownerId !== null && Number(ownerId) !== organisationId) {
          findings.push({
            code: reference.dereferenced ? 'crossOrgReferenceFollowed' : 'crossOrgReference',
            params: {
              collection,
              id: reference.id,
              organisation: organisationId,
              owner: Number(ownerId),
            },
            path: reference.path,
            related: { collection, id: reference.id },
            severity: reference.dereferenced ? 'blocking' : 'degrading',
            source: reference.owner,
          })
        }
      }
    }

    return findings
  }

  /** Required fields are only fatal in the default locale — `fallback: true` covers the rest. */
  private checkRequiredFields(
    entity: LoadedEntity,
    source: TenantHealthEntityRef,
  ): TenantHealthFinding[] {
    const findings: TenantHealthFinding[] = []
    const defaultLocale = this.payload.config.localization
      ? this.payload.config.localization.defaultLocale
      : 'de'

    const { name } = entity
    const localisedName = typeof name === 'object' && name !== null ? name[defaultLocale] : name

    if (!localisedName) {
      findings.push({
        code: 'missingRequiredField',
        locale: defaultLocale,
        params: { field: 'name', locale: defaultLocale },
        path: 'name',
        severity: 'blocking',
        source,
      })
    }

    if (source.collection === 'activities' && !entity.variant) {
      findings.push({
        code: 'missingRequiredField',
        params: { field: 'variant', locale: defaultLocale },
        path: 'variant',
        severity: 'blocking',
        source,
      })
    }

    return findings
  }

  private async checkS3(): Promise<TenantHealthPreconditionResult> {
    if (!this.bucket) {
      return { code: 's3BucketMissing', ok: false }
    }

    try {
      // A HEAD on a key that will not exist still proves credentials, region and endpoint
      // are right: a wrong region or bad signature fails differently than "not found".
      await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: '__tenant-health-probe__' }),
      )
      return { ok: true }
    } catch (error) {
      if (isNotFound(error)) {
        return { ok: true }
      }

      return {
        code: 's3Unreachable',
        error: `${process.env.S3_ENDPOINT} (region ${process.env.S3_REGION}): ${describe(error)}`,
        ok: false,
      }
    }
  }

  private async findAll(
    collection: 'activities' | 'task-flows' | 'task-lists',
    organisationId: number,
  ): Promise<LoadedEntity[]> {
    const { docs } = await this.payload.find({
      collection,
      depth: 0,
      limit: 0,
      // Localized fields come back keyed by locale, which is what the required-field and
      // per-locale block checks need.
      locale: 'all',
      overrideAccess: true,
      where: { organisation: { equals: organisationId } },
    })

    return (docs as unknown as LoadedEntity[]).map((doc) => ({ ...doc, __collection: collection }))
  }

  private async probeS3(
    entries: { id: number; key: string; related?: TenantHealthEntityRef }[],
  ): Promise<TenantHealthFinding[]> {
    const findings: TenantHealthFinding[] = []

    for (let index = 0; index < entries.length; index += S3_PROBE_CONCURRENCY) {
      const batch = entries.slice(index, index + S3_PROBE_CONCURRENCY)

      const results = await Promise.all(
        batch.map(async (entry) => {
          try {
            await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: entry.key }))
            return null
          } catch (error) {
            const failure: {
              code: TenantHealthFindingCode
              params: Record<string, number | string>
            } = isNotFound(error)
              ? { code: 's3ObjectMissing', params: { key: entry.key } }
              : { code: 's3ObjectUnreadable', params: { error: describe(error), key: entry.key } }

            return failure
          }
        }),
      )

      for (const [offset, result] of results.entries()) {
        if (!result) {
        	continue;
        }

        const entry = batch[offset]!

        findings.push({
          code: result.code,
          params: result.params,
          related: entry.related,
          severity: 'degrading',
          source: { collection: 'documents', id: entry.id },
        })
      }
    }

    return findings
  }
}

/**
 * Walks a whole document generically rather than following known field paths.
 *
 * Enumerating paths is how `document-scanner.ts` came to walk a `tasks` key that neither
 * TaskFlow (`blocks`) nor TaskList (`items`) actually has. A health check that misses a
 * subtree reports "healthy" for broken data, so this recognises the *shapes* instead:
 * every `{ relationTo, value }` pair (block relations and lexical document links alike)
 * and every `document` key holding an id.
 */
export const walkForReferences = (root: unknown): WalkResult => {
  const result: WalkResult = { malformedRichText: [], references: [] }

  const visit = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      for (const [index, item] of node.entries()) {
        visit(item, `${path}[${index}]`)
      }
      return
    }

    if (!node || typeof node !== 'object') {
      return
    }

    const record = node as Record<string, unknown>

    if (typeof record.relationTo === 'string' && record.value !== undefined) {
      const id = toId(record.value)
      if (id !== null) {
        result.references.push({
          collection: record.relationTo,
          dereferenced: isDereferencedPath(path),
          id,
          path,
        })
      }
    }

    if (record.document !== undefined && record.document !== null) {
      const id = toId(record.document)
      if (id !== null) {
        result.references.push({
          collection: 'documents',
          // File attachments are cloned inside a try/catch that degrades to a
          // "missing file" note rather than aborting.
          dereferenced: false,
          id,
          path: `${path}.document`,
        })
      }
    }

    // `processRichTextField` accepts a Lexical `{ root }` object or a Slate node array and
    // passes anything else straight through to `payload.create`, where it fails.
    if ('root' in record && record.root !== undefined) {
      const richTextRoot = record.root

      if (!richTextRoot || typeof richTextRoot !== 'object' || Array.isArray(richTextRoot)) {
        result.malformedRichText.push({ code: 'malformedRichTextRoot', path })
      } else if (!Array.isArray((richTextRoot as { children?: unknown }).children)) {
        result.malformedRichText.push({ code: 'malformedRichTextNoChildren', path })
      }
    }

    for (const [key, value] of Object.entries(record)) {
      if (key === 'relationTo' || key === 'value') {
        continue
      }
      visit(value, path ? `${path}.${key}` : key)
    }
  }

  visit(root, '')

  return result
}

/**
 * Turns a dotted walk path into something navigable.
 *
 * Payload gives every array/blocks row a DOM id of `<field>-row-<index>` and every
 * top-level field one of `field-<name>`, so both forms of path resolve to a real anchor:
 *
 *   blocks.de[0].keypoints.…  → blocks-row-0   (activities, task-flows)
 *   items[2].…                → items-row-2    (task-lists)
 *   files[0].document         → files-row-0
 *   description.de.root.…     → field-description
 *
 * The optional two-letter segment is the locale, which appears because localized fields come
 * back keyed by locale under `locale: 'all'`.
 */
export const describeLocation = (path?: string): TenantHealthLocation | undefined => {
  if (!path) {
    return undefined
  }

  // Numbered rather than named groups: the tsconfig target predates named capture groups.
  // [1] array field, [2] locale, [3] row index, [4] first field segment inside the row.
  const row = /^([A-Za-z]+)(?:\.([a-z]{2}))?\[(\d+)\](?:\.([^.[]+))?/.exec(path)

  if (row) {
    const index = Number(row[3])

    return {
      anchor: `${row[1]}-row-${index}`,
      container: row[1],
      field: row[4],
      locale: row[2],
      rowNumber: index + 1,
    }
  }

  const topLevel = /^([A-Za-z]+)(?:\.([a-z]{2}))?/.exec(path)

  return topLevel
    ? { anchor: `field-${topLevel[1]}`, field: topLevel[1], locale: topLevel[2] }
    : undefined
}

const buildReport = (
  parts: Omit<TenantHealthReport, 'checkedAt' | 'summary'>,
): TenantHealthReport => {
  // Resolved once here rather than at each push site, so no finding can ship a path
  // without the navigable location that goes with it.
  const findings = parts.findings.map((finding) => ({
    ...finding,
    location: describeLocation(finding.path),
  }))

  const blocking = findings.filter((finding) => finding.severity === 'blocking').length
  const degrading = findings.length - blocking

  return {
    ...parts,
    checkedAt: new Date().toISOString(),
    findings,
    summary: {
      blocking,
      degrading,
      healthy:
        blocking === 0 &&
        degrading === 0 &&
        parts.preconditions.s3.ok &&
        parts.preconditions.apiKey.ok,
    },
  }
}

const describe = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error'

/**
 * `cloneActivityBlocks` resolves every entry under a block's `relations.tasks` with
 * `findByID`, uncaught. Those are the only references whose breakage stops a clone.
 */
const isDereferencedPath = (path: string): boolean => path.includes('relations.tasks')

const isNotFound = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const { name } = error as { name?: string }
  const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode

  return name === 'NotFound' || name === 'NoSuchKey' || status === 404
}

const toId = (value: unknown): null | number => {
  if (typeof value === 'number') {
    return value
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const { id } = value as { id?: unknown }
    return typeof id === 'number' ? id : null
  }

  return null
}

const uniqueIds = (references: RawReference[]): number[] =>
  Array.from(new Set(references.map((reference) => reference.id)))
