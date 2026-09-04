import type { PayloadRequest } from 'payload'

import { describe, expect, type Mock, test, vi } from 'vitest'

import type { Activity } from '@/payload-types'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'

import { cloneRelatedDocumentFiles } from './clone-related-document-files'

const PLAN_ID = 243
const NORM_ID = 244
const ENTITY_ID = 1

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
  })

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

    await expect(
      run(makeReq(vi.fn(), update), preloaderWith({ [PLAN_ID]: 900 }, [normFailure]), tracker),
    ).resolves.toBeUndefined()

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
