import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest'

// The three stubs keep the access check, the bucket and the clone itself out of the run. The
// endpoint's own phase order, transaction handling and cleanup stay real.
vi.mock('@/payload/utilities/cloning/validate-access', () => ({
  validateCloneAccess: vi.fn(),
}))
vi.mock('@/payload/utilities/cloning/document-preloader', () => ({
  preloadDocuments: vi.fn(),
}))
vi.mock('@/payload/collections/Activities/endpoints/clone/utils/clone-activity', () => ({
  cloneActivity: vi.fn(),
}))

import type { Activity } from '@/payload-types'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { cloneActivity } from '@/payload/collections/Activities/endpoints/clone/utils/clone-activity'
import { CloneHttpError } from '@/payload/utilities/cloning/clone-http-error'
import { preloadDocuments } from '@/payload/utilities/cloning/document-preloader'
import { validateCloneAccess } from '@/payload/utilities/cloning/validate-access'

import { cloneActivityTransactional } from './clone-activity-transactional'

const ACTIVITY_ID = 5
const DOCUMENT_ID = 243
const NESTED_DOCUMENT_ID = 812
const NESTED_TASK_FLOW_ID = 55
const CLONED_DOCUMENT_ID = 900
const TARGET_ORG_ID = 11

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }

const config = {
  localization: { defaultLocale: 'de', locales: [{ code: 'de' }, { code: 'fr' }] },
}

const documentLink = (documentId: number) => ({
  root: {
    children: [
      {
        children: [
          { fields: { doc: { relationTo: 'documents', value: documentId } }, type: 'link' },
        ],
        type: 'paragraph',
      },
    ],
    type: 'root',
  },
})

interface ReqMocks {
  beginTransaction: Mock
  commitTransaction: Mock
  delete: Mock
  findByID: Mock
  rollbackTransaction: Mock
}

const makeReq = (
  transactionID: string,
  overrides: Partial<ReqMocks> = {},
): { mocks: ReqMocks; req: PayloadRequest } => {
  const mocks: ReqMocks = {
    beginTransaction: vi.fn().mockResolvedValue(transactionID),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue({}),
    findByID: vi
      .fn()
      .mockResolvedValue({ files: [{ document: DOCUMENT_ID }], id: ACTIVITY_ID, name: 'Source' }),
    rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }

  const req = {
    context: {},
    json: async () => ({ ids: [ACTIVITY_ID], locale: 'de', targetOrganisationId: TARGET_ORG_ID }),
    payload: {
      config,
      db: {
        beginTransaction: mocks.beginTransaction,
        commitTransaction: mocks.commitTransaction,
        rollbackTransaction: mocks.rollbackTransaction,
      },
      delete: mocks.delete,
      findByID: mocks.findByID,
      logger,
    },
    user: { id: 1 },
  } as unknown as PayloadRequest

  return { mocks, req }
}

const preloader = (): DocumentPreloader => ({
  clonedDocumentIds: new Map([[DOCUMENT_ID, CLONED_DOCUMENT_ID]]),
  errors: [],
  preloadedDocuments: new Map(),
})

const handle = (req: PayloadRequest) => cloneActivityTransactional.handler(req)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(validateCloneAccess).mockResolvedValue({ isValid: true })
  vi.mocked(preloadDocuments).mockResolvedValue(preloader())
  vi.mocked(cloneActivity).mockResolvedValue({ id: 77, name: 'Clone' } as unknown as Activity)
})

describe('cloneActivityTransactional', () => {
  // One document create costs seconds. Inside the transaction it holds a pooled connection
  // idle for that long, so the copies must exist before `beginTransaction` runs.
  test('copies the documents before it opens the transaction', async () => {
    const { mocks, req } = makeReq('tx-activity-order')

    const response = await handle(req)

    expect(response.status).toBe(200)
    expect(preloadDocuments).toHaveBeenCalledWith(req, [DOCUMENT_ID], TARGET_ORG_ID)
    expect(vi.mocked(preloadDocuments).mock.invocationCallOrder[0]).toBeLessThan(
      mocks.beginTransaction.mock.invocationCallOrder[0],
    )
    expect(mocks.commitTransaction).toHaveBeenCalledWith('tx-activity-order')
    expect(mocks.delete).not.toHaveBeenCalled()
  })

  // A block names a task in the locale that holds the block. The task carries locales of its
  // own, and phase 2 copies every one of them.
  test('reads every locale of a task a block names, and copies its documents too', async () => {
    const findByID = vi
      .fn()
      .mockImplementation(async ({ collection, locale }: { collection: string; locale: string }) => {
        if (collection === 'activities') {
          return locale === 'de'
            ? {
                blocks: [
                  {
                    relations: {
                      tasks: [{ relationTo: 'task-flows', value: { id: NESTED_TASK_FLOW_ID } }],
                    },
                  },
                ],
                files: [{ document: DOCUMENT_ID }],
                id: ACTIVITY_ID,
                name: 'Source',
              }
            : { blocks: null, files: null, id: ACTIVITY_ID }
        }

        // The French keypoints of the task link a document the activity's own locales never reach.
        return locale === 'fr'
          ? { blocks: [{ keypoints: { keypoints: documentLink(NESTED_DOCUMENT_ID) } }], id: NESTED_TASK_FLOW_ID }
          : { id: NESTED_TASK_FLOW_ID }
      })
    const { req } = makeReq('tx-activity-nested', { findByID })

    await handle(req)

    expect(preloadDocuments).toHaveBeenCalledWith(
      req,
      [DOCUMENT_ID, NESTED_DOCUMENT_ID],
      TARGET_ORG_ID,
    )
  })

  test('passes the phase 1 map and the transactional request into the clone', async () => {
    const { req } = makeReq('tx-activity-args')

    await handle(req)

    const params = vi.mocked(cloneActivity).mock.calls[0][0]
    expect(params.documentPreloader.clonedDocumentIds.get(DOCUMENT_ID)).toBe(CLONED_DOCUMENT_ID)
    expect(params.req.transactionID).toBe('tx-activity-args')
    expect(params).toMatchObject({ sourceId: ACTIVITY_ID, targetOrgId: TARGET_ORG_ID })
  })

  // Phase 1 committed each copy on its own connection. The rollback cannot reach them, so the
  // endpoint deletes them itself, and the response still carries the error that caused it.
  test('rolls back, deletes the phase 1 copies and answers the error status when phase 2 fails', async () => {
    vi.mocked(cloneActivity).mockRejectedValue(new CloneHttpError('name is required', 400))
    const { mocks, req } = makeReq('tx-activity-fail')

    const response = await handle(req)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Failed to clone activities: name is required',
    })
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith('tx-activity-fail')
    expect(mocks.delete).toHaveBeenCalledWith({
      collection: 'documents',
      id: CLONED_DOCUMENT_ID,
      overrideAccess: true,
      req,
    })
    expect(mocks.commitTransaction).not.toHaveBeenCalled()
  })

  // The drizzle adapter throws when no connection is free, and never answers null.
  test('deletes the phase 1 copies and answers 500 when the transaction cannot start', async () => {
    const { mocks, req } = makeReq('tx-activity-no-begin', {
      beginTransaction: vi.fn().mockRejectedValue(new Error('cannot begin transaction')),
    })

    const response = await handle(req)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Failed to clone activities: cannot begin transaction',
    })
    expect(mocks.delete).toHaveBeenCalledWith({
      collection: 'documents',
      id: CLONED_DOCUMENT_ID,
      overrideAccess: true,
      req,
    })
    expect(cloneActivity).not.toHaveBeenCalled()
  })

  test('keeps the original error when the cleanup fails', async () => {
    vi.mocked(cloneActivity).mockRejectedValue(new CloneHttpError('name is required', 400))
    const { req } = makeReq('tx-activity-cleanup-fails', {
      delete: vi.fn().mockRejectedValue(new Error('NotFound')),
    })

    const response = await handle(req)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Failed to clone activities: name is required',
    })
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: CLONED_DOCUMENT_ID, error: 'NotFound' }),
    )
  })
})
