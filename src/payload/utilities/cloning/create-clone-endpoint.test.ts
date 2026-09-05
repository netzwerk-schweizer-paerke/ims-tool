import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest'

// The two stubs keep the access check and the bucket out of the run. The handler's own body
// parse, phase order, transaction handling, cleanup and status derivation stay real.
vi.mock('@/payload/utilities/cloning/validate-access', () => ({
  validateCloneAccess: vi.fn(),
}))
vi.mock('@/payload/utilities/cloning/document-preloader', () => ({
  preloadDocuments: vi.fn(),
}))

import type { CloneEndpointConfig } from '@/payload/utilities/cloning/create-clone-endpoint'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { CloneHttpError } from '@/payload/utilities/cloning/clone-http-error'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import { createCloneEndpoint } from '@/payload/utilities/cloning/create-clone-endpoint'
import { preloadDocuments } from '@/payload/utilities/cloning/document-preloader'
import { validateCloneAccess } from '@/payload/utilities/cloning/validate-access'

const SOURCE_ID = 5
const DOCUMENT_ID = 243
const NESTED_DOCUMENT_ID = 812
const CLONED_DOCUMENT_ID = 900
const TARGET_ORG_ID = 11
const RETAINED_SOURCE = 'retained by readSource'

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }

const config = {
  localization: { defaultLocale: 'de', locales: [{ code: 'de' }, { code: 'fr' }] },
}

const validBody = { ids: [SOURCE_ID], locale: 'de', targetOrganisationId: TARGET_ORG_ID }

interface ReqMocks {
  beginTransaction: Mock
  commitTransaction: Mock
  delete: Mock
  findByID: Mock
  rollbackTransaction: Mock
  update: Mock
}

const makeReq = (
  transactionID: string,
  overrides: Partial<ReqMocks> = {},
  body: unknown = validBody,
): { mocks: ReqMocks; req: PayloadRequest } => {
  const mocks: ReqMocks = {
    beginTransaction: vi.fn().mockResolvedValue(transactionID),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue({}),
    // The link remap reads every clone back. A record with no link writes nothing.
    findByID: vi.fn().mockResolvedValue({ id: 77, name: 'Clone' }),
    rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue({ id: 77 }),
    ...overrides,
  }

  const req = {
    context: {},
    json: async () => body,
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
      update: mocks.update,
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

type Config = CloneEndpointConfig<string>

const cloneSource = vi.fn<Config['cloneSource']>()
const collectNestedDocumentIds = vi.fn<NonNullable<Config['collectNestedDocumentIds']>>()
const readSource = vi.fn<Config['readSource']>()

const endpoint = createCloneEndpoint<string>({
  cloneSource,
  collectionSlug: 'task-flows',
  collectNestedDocumentIds,
  label: { plural: 'widgets', singular: 'Widget' },
  readSource,
})

const handle = (req: PayloadRequest) => endpoint.handler(req)

const deletedCopy = expect.objectContaining({
  collection: 'documents',
  id: CLONED_DOCUMENT_ID,
  overrideAccess: true,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(validateCloneAccess).mockResolvedValue({ isValid: true })
  vi.mocked(preloadDocuments).mockResolvedValue(preloader())
  readSource.mockResolvedValue({
    documentIds: [DOCUMENT_ID],
    name: 'Source',
    source: RETAINED_SOURCE,
  })
  collectNestedDocumentIds.mockResolvedValue([])
  cloneSource.mockResolvedValue({ id: 77, name: 'Clone' })
})

describe('createCloneEndpoint', () => {
  test('answers 400 with the field errors when the body does not parse', async () => {
    const { mocks, req } = makeReq('tx-body', {}, { ids: [], locale: 'de' })

    const response = await handle(req)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ message: 'Validation failed' })
    expect(readSource).not.toHaveBeenCalled()
    expect(mocks.beginTransaction).not.toHaveBeenCalled()
  })

  test('answers 400 when the request locale is not a content locale', async () => {
    const { req } = makeReq('tx-locale', {}, { ...validBody, locale: 'en' })

    const response = await handle(req)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Unsupported locale' })
    expect(readSource).not.toHaveBeenCalled()
  })

  // The access check answers a structured status. A plain Error here would read as a 500.
  test('answers the access status, with the singular label, before any read', async () => {
    vi.mocked(validateCloneAccess).mockResolvedValue({
      error: { message: 'no admin role in the target organisation', status: 403 },
      isValid: false,
    })
    const { mocks, req } = makeReq('tx-access')

    const response = await handle(req)

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to clone widgets: Widget 5: no admin role in the target organisation',
    })
    expect(readSource).not.toHaveBeenCalled()
    expect(preloadDocuments).not.toHaveBeenCalled()
    expect(mocks.beginTransaction).not.toHaveBeenCalled()
  })

  // Nothing is copied yet, so there is nothing to delete and no transaction to roll back.
  test('answers the error status and opens no transaction when a source read fails', async () => {
    readSource.mockRejectedValue(new CloneHttpError('Not Found', 404))
    const { mocks, req } = makeReq('tx-read')

    const response = await handle(req)

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'Failed to clone widgets: Not Found' })
    expect(mocks.beginTransaction).not.toHaveBeenCalled()
    expect(mocks.delete).not.toHaveBeenCalled()
  })

  test('reads every source before the preload, and hands the nested scan every retained source', async () => {
    collectNestedDocumentIds.mockResolvedValue([NESTED_DOCUMENT_ID, DOCUMENT_ID])
    const { mocks, req } = makeReq('tx-order', {}, { ...validBody, ids: [SOURCE_ID, 6] })

    const response = await handle(req)

    expect(response.status).toBe(200)
    expect(readSource).toHaveBeenCalledTimes(2)
    expect(collectNestedDocumentIds).toHaveBeenCalledWith({
      cloneLocales: ['de', 'fr'],
      req,
      sources: [RETAINED_SOURCE, RETAINED_SOURCE],
    })
    // A duplicate collapses, and the copies exist before the transaction opens.
    expect(preloadDocuments).toHaveBeenCalledWith(
      req,
      [DOCUMENT_ID, NESTED_DOCUMENT_ID],
      TARGET_ORG_ID,
    )
    expect(vi.mocked(preloadDocuments).mock.invocationCallOrder[0]).toBeLessThan(
      mocks.beginTransaction.mock.invocationCallOrder[0],
    )
  })

  test('passes the retained source and the transactional request into the clone, then commits once', async () => {
    const { mocks, req } = makeReq('tx-clone')

    const response = await handle(req)

    expect(response.status).toBe(200)
    expect(cloneSource).toHaveBeenCalledTimes(1)
    const args = cloneSource.mock.calls[0][0]
    expect(args).toMatchObject({
      cloneLocales: ['de', 'fr'],
      source: RETAINED_SOURCE,
      sourceId: SOURCE_ID,
      targetOrgId: TARGET_ORG_ID,
    })
    expect(args.req.transactionID).toBe('tx-clone')
    expect(args.documentPreloader.clonedDocumentIds.get(DOCUMENT_ID)).toBe(CLONED_DOCUMENT_ID)
    // The handler owns the tracker's lifetime. The clone receives the started instance.
    expect(args.tracker).toBeInstanceOf(CloneStatisticsTracker)
    expect(args.tracker.getStatistics(SOURCE_ID).source.name).toBe('Source')
    expect(mocks.commitTransaction).toHaveBeenCalledWith('tx-clone')
    expect(mocks.delete).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({
      message: 'Executed successfully',
      results: {
        entities: [
          {
            cloned: { collection: 'task-flows', id: 77, name: 'Clone' },
            source: { collection: 'task-flows', id: SOURCE_ID, name: 'Source' },
          },
        ],
        successLevel: 'success',
      },
    })
  })

  // The drizzle adapter throws when no connection is free, and never answers null. The guard
  // covers an adapter that answers null all the same, because both leave the copies behind.
  test('deletes the copies and answers 500 when the adapter answers no transaction id', async () => {
    const { mocks, req } = makeReq('tx-null', {
      beginTransaction: vi.fn().mockResolvedValue(null),
    })

    const response = await handle(req)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to clone widgets: The database adapter did not start a transaction',
    })
    expect(mocks.delete).toHaveBeenCalledWith(deletedCopy)
    expect(cloneSource).not.toHaveBeenCalled()
    expect(mocks.rollbackTransaction).not.toHaveBeenCalled()
  })

  test('deletes the copies and answers 500 when the adapter throws on begin', async () => {
    const { mocks, req } = makeReq('tx-throw', {
      beginTransaction: vi.fn().mockRejectedValue(new Error('cannot begin transaction')),
    })

    const response = await handle(req)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to clone widgets: cannot begin transaction',
    })
    expect(mocks.delete).toHaveBeenCalledWith(deletedCopy)
    expect(cloneSource).not.toHaveBeenCalled()
  })

  // Phase 1 committed each copy on its own connection. The rollback cannot reach them, so the
  // handler deletes them itself, and the response still carries the status the error names.
  test('rolls back, deletes the copies and answers the status the error carries', async () => {
    cloneSource.mockRejectedValue(new CloneHttpError('name is required', 400))
    const { mocks, req } = makeReq('tx-rollback')

    const response = await handle(req)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      details: [],
      error: 'Failed to clone widgets: name is required',
    })
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith('tx-rollback')
    expect(mocks.delete).toHaveBeenCalledWith(deletedCopy)
    expect(mocks.commitTransaction).not.toHaveBeenCalled()
  })

  test('answers 500 for an error that carries no status', async () => {
    cloneSource.mockRejectedValue(new Error('connection reset'))
    const { req } = makeReq('tx-plain')

    const response = await handle(req)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Failed to clone widgets: connection reset',
    })
  })

  // Payload's ValidationError names the field in `data.errors` only. The body carries it.
  test('answers the field details of a Payload validation error', async () => {
    cloneSource.mockRejectedValue(
      Object.assign(new Error('The following field is invalid: name'), {
        data: { errors: [{ message: 'required', path: 'name' }] },
        status: 400,
      }),
    )
    const { req } = makeReq('tx-details')

    const response = await handle(req)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      details: ['name: required'],
      error: 'Failed to clone widgets: The following field is invalid: name',
    })
  })

  test('keeps the original error when the cleanup fails', async () => {
    cloneSource.mockRejectedValue(new CloneHttpError('name is required', 400))
    const { req } = makeReq('tx-cleanup', {
      delete: vi.fn().mockRejectedValue(new Error('NotFound')),
    })

    const response = await handle(req)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Failed to clone widgets: name is required',
    })
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: CLONED_DOCUMENT_ID, error: 'NotFound' }),
    )
  })

  // The tracker lives in a static map keyed by transaction id. The run must free it either way.
  test('frees the tracker after a commit and after a rollback', async () => {
    const dispose = vi.spyOn(CloneStatisticsTracker, 'disposeInstance')

    await handle(makeReq('tx-free-commit').req)
    cloneSource.mockRejectedValue(new Error('boom'))
    await handle(makeReq('tx-free-rollback').req)

    expect(dispose).toHaveBeenCalledWith('tx-free-commit')
    expect(dispose).toHaveBeenCalledWith('tx-free-rollback')
    dispose.mockRestore()
  })
})
