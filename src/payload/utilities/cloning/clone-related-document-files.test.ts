import type { PayloadRequest } from 'payload'

import { describe, expect, type Mock, test, vi } from 'vitest'

import type { Activity } from '@/payload-types'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'

import { cloneRelatedDocumentFiles } from './clone-related-document-files'

const PLAN_ID = 243
const NORM_ID = 244
const FR_PLAN_ID = 245
const FR_NORM_ID = 246
const ENTITY_ID = 1

type RunOverrides = Partial<
  Pick<Parameters<typeof cloneRelatedDocumentFiles>[0], 'clonedFileRows' | 'locale' | 'sourceEntity'>
>

/** The rows of one source in another locale. A row holds only that locale's document. */
const filesIn = (...documents: (null | number)[]): Activity =>
  ({ files: documents.map((document) => ({ document })), id: ENTITY_ID }) as unknown as Activity

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }

/** No transaction id. The helper takes its tracker as a parameter and reads none from a map. */
const makeReq = (findByID: Mock, update: Mock): PayloadRequest =>
  ({ payload: { findByID, logger, update } }) as unknown as PayloadRequest

const sourceEntity = {
  files: [{ document: { id: PLAN_ID, name: 'Plan' } }, { document: NORM_ID }],
  id: ENTITY_ID,
} as unknown as Activity

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

const normFailure = {
  documentId: NORM_ID,
  documentName: 'Norm',
  error: 'NoSuchKey',
  fileName: 'norm.docx',
}

const startedTracker = () => {
  const tracker = new CloneStatisticsTracker()
  tracker.startEntity(ENTITY_ID)
  return tracker
}

const run = (
  req: PayloadRequest,
  documentPreloader: DocumentPreloader,
  tracker = startedTracker(),
  overrides: RunOverrides = {},
) =>
  cloneRelatedDocumentFiles({
    collectionName: 'activities',
    documentPreloader,
    locale: 'de',
    req,
    sourceEntity,
    targetEntityId: 2,
    targetOrgId: 11,
    tracker,
    ...overrides,
  })

/** The data of every `update` call, in order. */
const updateData = (update: Mock) =>
  update.mock.calls.map((call) => (call[0] as { data: { files?: unknown } }).data)

describe('cloneRelatedDocumentFiles', () => {
  test('writes the copied rows to the entity when phase 1 copied every document', async () => {
    const update = vi.fn().mockResolvedValue({})
    const tracker = startedTracker()

    await run(makeReq(vi.fn(), update), preloaderWith({ [NORM_ID]: 901, [PLAN_ID]: 900 }), tracker)

    expect(update.mock.calls[0][0]).toMatchObject({
      collection: 'activities',
      data: { files: [{ document: 900 }, { document: 901 }] },
      id: 2,
    })
    expect(tracker.getStatistics(ENTITY_ID).cloned.documentFilesCount).toBe(2)
  })

  // A document phase 1 could not copy is one missing attachment. The lookup ran no Payload
  // operation, so the transaction is intact and the clone completes.
  test('skips a document phase 1 could not copy, and completes with the missing-file row', async () => {
    const update = vi.fn().mockResolvedValue({})
    const tracker = startedTracker()

    // The failed row is not written. A later locale that carries its document writes it then.
    await expect(
      run(makeReq(vi.fn(), update), preloaderWith({ [PLAN_ID]: 900 }, [normFailure]), tracker),
    ).resolves.toEqual([
      { id: expect.any(String), written: true },
      { id: expect.any(String), written: false },
    ])

    expect(update.mock.calls[0][0]).toMatchObject({ data: { files: [{ document: 900 }] } })
    expect(tracker.getStatistics(ENTITY_ID).errors.missingDocumentFiles).toEqual([
      {
        documentId: NORM_ID,
        documentName: 'Norm',
        error: 'NoSuchKey',
        fileName: 'norm.docx',
        usageLocation: 'Direct file attachment',
      },
    ])
    expect(tracker.getStatistics(ENTITY_ID).source.documentFilesCount).toBe(2)
    expect(tracker.getStatistics(ENTITY_ID).cloned.documentFilesCount).toBe(1)
  })

  // A read of the source document would run inside the transaction. Payload rolls the
  // transaction back when that read fails, and every later write commits on its own.
  test('runs no Payload read for the failed document', async () => {
    const findByID = vi.fn()

    await run(
      makeReq(findByID, vi.fn().mockResolvedValue({})),
      preloaderWith({ [PLAN_ID]: 900 }, [normFailure]),
    )

    expect(findByID).not.toHaveBeenCalled()
  })

  test('names the populated document when phase 1 recorded no name', async () => {
    const tracker = startedTracker()

    await run(
      makeReq(vi.fn(), vi.fn().mockResolvedValue({})),
      preloaderWith({ [NORM_ID]: 901 }, [{ documentId: PLAN_ID, error: 'NotFound' }]),
      tracker,
    )

    expect(tracker.getStatistics(ENTITY_ID).errors.missingDocumentFiles).toEqual([
      {
        documentId: PLAN_ID,
        documentName: 'Plan',
        error: 'NotFound',
        fileName: 'Unknown',
        usageLocation: 'Direct file attachment',
      },
    ])
  })

  // The create wrote the source rows first. A skipped write would leave document ids of the
  // source organisation on the clone, which the public share loader reads across the tenant.
  test('writes an empty array when every document failed, so no source id survives', async () => {
    const update = vi.fn().mockResolvedValue({})

    await run(
      makeReq(vi.fn(), update),
      preloaderWith({}, [normFailure, { documentId: PLAN_ID, error: 'NoSuchKey' }]),
    )

    expect(update).toHaveBeenCalledTimes(1)
    expect(update.mock.calls[0][0]).toMatchObject({ data: { files: [] }, id: 2 })
  })

  // Measured on payload@3.88.0: an array write replaces every row. A row sent without its id
  // loses its other locales, and a row sent with its id keeps them.
  test('fixes one id per row before the first write and sends it', async () => {
    const update = vi.fn().mockResolvedValue({})

    const rows = await run(makeReq(vi.fn(), update), preloaderWith({ [NORM_ID]: 901, [PLAN_ID]: 900 }))

    expect(rows).toEqual([
      { id: expect.any(String), written: true },
      { id: expect.any(String), written: true },
    ])
    expect(rows[0].id).not.toBe(rows[1].id)
    expect(updateData(update)[0]).toEqual({
      files: [
        { document: 900, id: rows[0].id },
        { document: 901, id: rows[1].id },
      ],
    })
  })

  test('sends the same row ids on a later locale pass, with the copies of that locale', async () => {
    const update = vi.fn().mockResolvedValue({})
    const tracker = startedTracker()
    const req = makeReq(vi.fn(), update)
    const preloader = preloaderWith({
      [FR_NORM_ID]: 903,
      [FR_PLAN_ID]: 902,
      [NORM_ID]: 901,
      [PLAN_ID]: 900,
    })

    const deRows = await run(req, preloader, tracker)
    const frRows = await run(req, preloader, tracker, {
      clonedFileRows: deRows,
      locale: 'fr',
      sourceEntity: filesIn(FR_PLAN_ID, FR_NORM_ID),
    })

    expect(update.mock.calls[1][0]).toMatchObject({
      data: {
        files: [
          { document: 902, id: deRows[0].id },
          { document: 903, id: deRows[1].id },
        ],
      },
      locale: 'fr',
    })
    expect(frRows).toEqual(deRows)
    expect(tracker.getStatistics(ENTITY_ID).cloned.documentFilesCount).toBe(4)
  })

  // The pass would resend the rows the previous pass wrote, and Payload writes nothing new for
  // that. Each skipped update is one full-document write less inside the transaction.
  test('skips the write on a later pass in which no row carries a document', async () => {
    const update = vi.fn().mockResolvedValue({})
    const req = makeReq(vi.fn(), update)
    const preloader = preloaderWith({ [NORM_ID]: 901, [PLAN_ID]: 900 })

    const deRows = await run(req, preloader)
    const frRows = await run(req, preloader, startedTracker(), {
      clonedFileRows: deRows,
      locale: 'fr',
      sourceEntity: filesIn(null, null),
    })

    expect(update).toHaveBeenCalledTimes(1)
    expect(frRows).toEqual(deRows)
  })

  test('leaves out a row nobody wrote yet when it has no document in this locale', async () => {
    const update = vi.fn().mockResolvedValue({})
    const req = makeReq(vi.fn(), update)
    const preloader = preloaderWith({ [FR_PLAN_ID]: 902, [PLAN_ID]: 900 })

    const deRows = await run(req, preloader, startedTracker(), {
      sourceEntity: filesIn(PLAN_ID, null),
    })
    const frRows = await run(req, preloader, startedTracker(), {
      clonedFileRows: deRows,
      locale: 'fr',
      sourceEntity: filesIn(FR_PLAN_ID, null),
    })

    expect(deRows[1].written).toBe(false)
    expect(updateData(update)[1]).toEqual({ files: [{ document: 902, id: deRows[0].id }] })
    expect(frRows).toEqual(deRows)
  })

  test('writes a row on the first locale pass that carries its document', async () => {
    const update = vi.fn().mockResolvedValue({})
    const req = makeReq(vi.fn(), update)
    const preloader = preloaderWith({ [FR_NORM_ID]: 903, [PLAN_ID]: 900 })

    const deRows = await run(req, preloader, startedTracker(), {
      sourceEntity: filesIn(null, PLAN_ID),
    })
    const frRows = await run(req, preloader, startedTracker(), {
      clonedFileRows: deRows,
      locale: 'fr',
      sourceEntity: filesIn(FR_NORM_ID, null),
    })

    expect(updateData(update)[0]).toEqual({ files: [{ document: 900, id: deRows[1].id }] })
    expect(updateData(update)[1]).toEqual({
      files: [{ document: 903, id: deRows[0].id }, { id: deRows[1].id }],
    })
    expect(frRows).toEqual([
      { id: deRows[0].id, written: true },
      { id: deRows[1].id, written: true },
    ])
  })

  // The update is a Payload operation inside the transaction. Payload rolls the transaction
  // back when it fails, so the run must end here instead of continuing on a dead transaction.
  test('rejects when the update inside the transaction fails', async () => {
    const failure = new Error('duplicate key value violates unique constraint')

    await expect(
      run(
        makeReq(vi.fn(), vi.fn().mockRejectedValue(failure)),
        preloaderWith({ [NORM_ID]: 901, [PLAN_ID]: 900 }),
      ),
    ).rejects.toBe(failure)
  })
})
