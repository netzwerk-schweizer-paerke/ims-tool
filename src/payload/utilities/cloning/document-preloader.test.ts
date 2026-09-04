import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest'

// The real preloader reads the bytes from the bucket. The stub keeps the storage client out of
// the run, and it lets each test choose which download fails.
vi.mock('./read-document-file', () => ({
  readDocumentFile: vi.fn(),
}))

import {
  describePreloadFailure,
  type DocumentPreloader,
  preloadDocuments,
  resolvePreloadedDocumentId,
} from './document-preloader'
import { readDocumentFile } from './read-document-file'

const PLAN_ID = 243
const NORM_ID = 244
const TARGET_ORG_ID = 11

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }

const makeReq = (findByID: Mock, create: Mock): PayloadRequest =>
  ({ context: {}, payload: { create, findByID, logger } }) as unknown as PayloadRequest

const sourceDocument = (id: number, name: string) => ({
  description: `${name} description`,
  filename: `${name.toLowerCase()}.pdf`,
  filesize: 4,
  id,
  mimeType: 'application/pdf',
  name,
})

const bothDocuments: Record<number, unknown> = {
  [NORM_ID]: sourceDocument(NORM_ID, 'Norm'),
  [PLAN_ID]: sourceDocument(PLAN_ID, 'Plan'),
}

const findByIDAnswering = (documents: Record<number, unknown>) =>
  vi.fn().mockImplementation(async ({ id }: { id: number }) => {
    const document = documents[id]

    if (!document) {
      throw new Error('NotFound')
    }

    return document
  })

/** Answers a stable id per file, so the map is deterministic whatever order the batch settles in. */
const createAnswering = () =>
  vi.fn().mockImplementation(async ({ file }: { file: { name: string } }) => ({
    id: file.name.endsWith('plan.pdf') ? 900 : 901,
  }))

const preloaderWith = (
  cloned: Record<number, number>,
  errors: DocumentPreloader['errors'] = [],
): DocumentPreloader => ({
  clonedDocumentIds: new Map(
    Object.entries(cloned).map(([id, clonedId]) => [Number(id), clonedId]),
  ),
  errors,
  preloadedDocuments: new Map(),
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(readDocumentFile).mockResolvedValue(Buffer.from('%PDF'))
})

describe('preloadDocuments', () => {
  test('copies each document into the target organisation and maps the source id to the copy', async () => {
    const create = createAnswering()
    const req = makeReq(findByIDAnswering(bothDocuments), create)

    const preloader = await preloadDocuments(req, [PLAN_ID, NORM_ID, PLAN_ID], TARGET_ORG_ID)

    expect(preloader.errors).toEqual([])
    expect(preloader.clonedDocumentIds.get(PLAN_ID)).toBe(900)
    expect(preloader.clonedDocumentIds.get(NORM_ID)).toBe(901)
    expect(create).toHaveBeenCalledTimes(2)
    expect(create.mock.calls[0][0]).toMatchObject({
      collection: 'documents',
      data: { description: 'Plan description', organisation: TARGET_ORG_ID },
      file: {
        mimetype: 'application/pdf',
        name: expect.stringMatching(/^\d+-plan\.pdf$/),
        size: 4,
      },
      req: { context: { skipDocumentUsage: true, targetOrganisationId: TARGET_ORG_ID } },
    })
  })

  // The read and the create each run the Documents afterRead hook, whose three scans cost more
  // than the copy itself. Phase 1 opts out of them on both.
  test('reads and creates each document with the usage scan off', async () => {
    const findByID = findByIDAnswering(bothDocuments)
    const create = createAnswering()

    await preloadDocuments(makeReq(findByID, create), [PLAN_ID], TARGET_ORG_ID)

    expect(findByID.mock.calls[0][0]).toMatchObject({
      collection: 'documents',
      id: PLAN_ID,
      req: { context: { skipDocumentUsage: true } },
    })
    expect(create.mock.calls[0][0]).toMatchObject({
      req: { context: { skipDocumentUsage: true } },
    })
  })

  // One missing file is one missing attachment on the clone, never a failed clone.
  test('records a document whose download fails, and still copies the others', async () => {
    vi.mocked(readDocumentFile).mockImplementation(async (document) => {
      if (document.id === PLAN_ID) {
        throw new Error('NoSuchKey')
      }

      return Buffer.from('%PDF')
    })
    const create = createAnswering()

    const preloader = await preloadDocuments(
      makeReq(findByIDAnswering(bothDocuments), create),
      [PLAN_ID, NORM_ID],
      TARGET_ORG_ID,
    )

    expect(create).toHaveBeenCalledTimes(1)
    expect(Array.from(preloader.clonedDocumentIds)).toEqual([[NORM_ID, 901]])
    expect(preloader.errors).toEqual([
      { documentId: PLAN_ID, documentName: 'Plan', error: 'NoSuchKey', fileName: 'plan.pdf' },
    ])
  })

  test('records a document whose create fails, and never rejects', async () => {
    const create = vi.fn().mockRejectedValue(new Error('duplicate key'))

    const preloader = await preloadDocuments(
      makeReq(findByIDAnswering(bothDocuments), create),
      [PLAN_ID],
      TARGET_ORG_ID,
    )

    expect(preloader.clonedDocumentIds.size).toBe(0)
    expect(preloader.errors).toEqual([
      { documentId: PLAN_ID, documentName: 'Plan', error: 'duplicate key', fileName: 'plan.pdf' },
    ])
  })

  test('records a document that cannot be read, without a name', async () => {
    const preloader = await preloadDocuments(
      makeReq(findByIDAnswering({}), vi.fn()),
      [PLAN_ID],
      TARGET_ORG_ID,
    )

    expect(preloader.errors).toEqual([{ documentId: PLAN_ID, error: 'NotFound' }])
  })

  test('copies nothing for an empty id list', async () => {
    const findByID = vi.fn()

    const preloader = await preloadDocuments(makeReq(findByID, vi.fn()), [], TARGET_ORG_ID)

    expect(findByID).not.toHaveBeenCalled()
    expect(preloader.clonedDocumentIds.size).toBe(0)
  })
})

describe('resolvePreloadedDocumentId', () => {
  test('answers the id of the copy', () => {
    expect(resolvePreloadedDocumentId(preloaderWith({ [PLAN_ID]: 900 }), PLAN_ID)).toBe(900)
  })

  test('throws the failure phase 1 recorded', () => {
    const preloader = preloaderWith({}, [{ documentId: PLAN_ID, error: 'NoSuchKey' }])

    expect(() => resolvePreloadedDocumentId(preloader, PLAN_ID)).toThrow('NoSuchKey')
  })

  test('throws a synthesized failure for a document phase 1 never reached', () => {
    expect(() => resolvePreloadedDocumentId(preloaderWith({}), PLAN_ID)).toThrow(
      'Document 243 was not copied before the transaction opened',
    )
  })
})

describe('describePreloadFailure', () => {
  test('answers the recorded entry', () => {
    const entry = { documentId: PLAN_ID, documentName: 'Plan', error: 'NoSuchKey', fileName: 'plan.pdf' }

    expect(describePreloadFailure(preloaderWith({}, [entry]), PLAN_ID)).toBe(entry)
  })

  test('synthesizes an entry for an unknown document', () => {
    expect(describePreloadFailure(preloaderWith({}), NORM_ID)).toEqual({
      documentId: NORM_ID,
      error: 'Document 244 was not copied before the transaction opened',
    })
  })
})
