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

const makeReq = (transactionID: string, findByID: Mock, update: Mock): PayloadRequest =>
  ({ payload: { findByID, logger, update }, transactionID }) as unknown as PayloadRequest

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

const run = (req: PayloadRequest, documentPreloader: DocumentPreloader) =>
  cloneRelatedDocumentFiles({
    collectionName: 'activities',
    documentPreloader,
    locale: 'de',
    req,
    sourceEntity,
    targetEntityId: 2,
    targetOrgId: 11,
  })

/** Instances live in a static map keyed by transaction id, so every test needs its own key. */
const startedTracker = (transactionID: string) => {
  const tracker = CloneStatisticsTracker.getInstance(transactionID)
  tracker.startEntity(ENTITY_ID)
  return tracker
}

describe('cloneRelatedDocumentFiles', () => {
  test('writes the copied rows to the entity when phase 1 copied every document', async () => {
    const update = vi.fn().mockResolvedValue({})
    const tracker = startedTracker('tx-files-ok')

    await run(makeReq('tx-files-ok', vi.fn(), update), preloaderWith({ [NORM_ID]: 901, [PLAN_ID]: 900 }))

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
    const tracker = startedTracker('tx-files-partial')

    await expect(
      run(makeReq('tx-files-partial', vi.fn(), update), preloaderWith({ [PLAN_ID]: 900 }, [normFailure])),
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
    startedTracker('tx-files-no-read')

    await run(
      makeReq('tx-files-no-read', findByID, vi.fn().mockResolvedValue({})),
      preloaderWith({ [PLAN_ID]: 900 }, [normFailure]),
    )

    expect(findByID).not.toHaveBeenCalled()
  })

  test('names the populated document when phase 1 recorded no name', async () => {
    const tracker = startedTracker('tx-files-populated-name')

    await run(
      makeReq('tx-files-populated-name', vi.fn(), vi.fn().mockResolvedValue({})),
      preloaderWith({ [NORM_ID]: 901 }, [{ documentId: PLAN_ID, error: 'NotFound' }]),
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
    startedTracker('tx-files-all-failed')

    await run(
      makeReq('tx-files-all-failed', vi.fn(), update),
      preloaderWith({}, [normFailure, { documentId: PLAN_ID, error: 'NoSuchKey' }]),
    )

    expect(update).toHaveBeenCalledTimes(1)
    expect(update.mock.calls[0][0]).toMatchObject({ data: { files: [] }, id: 2 })
  })

  // The update is a Payload operation inside the transaction. Payload rolls the transaction
  // back when it fails, so the run must end here instead of continuing on a dead transaction.
  test('rejects when the update inside the transaction fails', async () => {
    const failure = new Error('duplicate key value violates unique constraint')
    startedTracker('tx-files-update-fails')

    await expect(
      run(
        makeReq('tx-files-update-fails', vi.fn(), vi.fn().mockRejectedValue(failure)),
        preloaderWith({ [NORM_ID]: 901, [PLAN_ID]: 900 }),
      ),
    ).rejects.toBe(failure)
  })
})
