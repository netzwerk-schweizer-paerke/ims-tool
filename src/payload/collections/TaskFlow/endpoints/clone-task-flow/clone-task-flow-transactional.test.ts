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
vi.mock('@/payload/collections/Activities/endpoints/clone/utils/clone-task-flow-or-list', () => ({
  createTaskFlow: vi.fn(),
}))

import type { TaskFlow } from '@/payload-types'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { createTaskFlow } from '@/payload/collections/Activities/endpoints/clone/utils/clone-task-flow-or-list'
import { CloneHttpError } from '@/payload/utilities/cloning/clone-http-error'
import { preloadDocuments } from '@/payload/utilities/cloning/document-preloader'
import { validateCloneAccess } from '@/payload/utilities/cloning/validate-access'

import { cloneTaskFlowTransactional } from './clone-task-flow-transactional'

const TASK_FLOW_ID = 7
const FILE_DOCUMENT_ID = 243
const LINKED_DOCUMENT_ID = 244
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
    rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }

  // The report name comes from a `locale: 'all'` read, and the scan from one read per locale.
  const findByID = vi.fn().mockImplementation(async ({ locale }: { locale: string }) =>
    locale === 'all'
      ? { id: TASK_FLOW_ID, name: { de: 'Quelle' } }
      : {
          blocks: [{ keypoints: { keypoints: documentLink(LINKED_DOCUMENT_ID) } }],
          files: [{ document: FILE_DOCUMENT_ID }],
          id: TASK_FLOW_ID,
          name: 'Quelle',
        },
  )

  const req = {
    context: {},
    json: async () => ({ ids: [TASK_FLOW_ID], locale: 'de', targetOrganisationId: TARGET_ORG_ID }),
    payload: {
      config,
      db: {
        beginTransaction: mocks.beginTransaction,
        commitTransaction: mocks.commitTransaction,
        rollbackTransaction: mocks.rollbackTransaction,
      },
      delete: mocks.delete,
      findByID,
      logger,
    },
    user: { id: 1 },
  } as unknown as PayloadRequest

  return { mocks, req }
}

const preloader = (): DocumentPreloader => ({
  clonedDocumentIds: new Map([[FILE_DOCUMENT_ID, CLONED_DOCUMENT_ID]]),
  errors: [],
  preloadedDocuments: new Map(),
})

const handle = (req: PayloadRequest) => cloneTaskFlowTransactional.handler(req)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(validateCloneAccess).mockResolvedValue({ isValid: true })
  vi.mocked(preloadDocuments).mockResolvedValue(preloader())
  vi.mocked(createTaskFlow).mockResolvedValue({ id: 77, name: 'Klon' } as unknown as TaskFlow)
})

describe('cloneTaskFlowTransactional', () => {
  // The endpoint used to open the transaction first and copy every document inside it.
  test('scans every locale and copies the documents before it opens the transaction', async () => {
    const { mocks, req } = makeReq('tx-task-flow-order')

    const response = await handle(req)

    expect(response.status).toBe(200)
    expect(preloadDocuments).toHaveBeenCalledWith(
      req,
      [FILE_DOCUMENT_ID, LINKED_DOCUMENT_ID],
      TARGET_ORG_ID,
    )
    expect(vi.mocked(preloadDocuments).mock.invocationCallOrder[0]).toBeLessThan(
      mocks.beginTransaction.mock.invocationCallOrder[0],
    )
    expect(createTaskFlow).toHaveBeenCalledWith(
      expect.objectContaining({ transactionID: 'tx-task-flow-order' }),
      TASK_FLOW_ID,
      TARGET_ORG_ID,
      ['de', 'fr'],
      expect.objectContaining({ clonedDocumentIds: new Map([[FILE_DOCUMENT_ID, CLONED_DOCUMENT_ID]]) }),
    )
    await expect(response.json()).resolves.toMatchObject({
      results: { entities: [{ cloned: { id: 77 }, source: { name: 'Quelle' } }] },
    })
    expect(mocks.commitTransaction).toHaveBeenCalledWith('tx-task-flow-order')
    expect(mocks.delete).not.toHaveBeenCalled()
  })

  // Phase 1 committed each copy on its own connection. The rollback cannot reach them, so the
  // endpoint deletes them itself, and the response still carries the error that caused it.
  test('rolls back, deletes the phase 1 copies and answers the error status when phase 2 fails', async () => {
    vi.mocked(createTaskFlow).mockRejectedValue(new CloneHttpError('name is required', 400))
    const { mocks, req } = makeReq('tx-task-flow-fail')

    const response = await handle(req)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Failed to clone task flows: name is required',
    })
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith('tx-task-flow-fail')
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
    const { mocks, req } = makeReq('tx-task-flow-no-begin', {
      beginTransaction: vi.fn().mockRejectedValue(new Error('cannot begin transaction')),
    })

    const response = await handle(req)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Failed to clone task flows: cannot begin transaction',
    })
    expect(mocks.delete).toHaveBeenCalledWith({
      collection: 'documents',
      id: CLONED_DOCUMENT_ID,
      overrideAccess: true,
      req,
    })
    expect(createTaskFlow).not.toHaveBeenCalled()
  })
})
