import type { PayloadRequest } from 'payload'

import { afterEach, beforeEach, describe, expect, type Mock, test, vi } from 'vitest'

// The scan is stubbed, so each activity carries the link the test chooses. The download and the
// create stay real, with `fetch` answering per url, so the phase order is the endpoint's own.
// The url validation reads `LEGACY_DOMAINS` from the same module, so the rest stays real.
vi.mock('./utils/scan-legacy-links', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./utils/scan-legacy-links')>()),
  scanLegacyLinks: vi.fn(),
}))

import type { Activity } from '@/payload-types'

import { fetchLegacyDocsTransactional } from './fetch-legacy-docs-transactional'
import { scanLegacyLinks } from './utils/scan-legacy-links'

const DEAD_URL = 'https://parcs-ims.ch/files/gone.pdf'
const LIVE_URL = 'https://parcs-ims.ch/files/plan.pdf'
const ORGANISATION_ID = 11
const CREATED_DOCUMENT_ID = 77

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }

const activity = (id: number): Activity =>
  ({ id, name: `Activity ${id}`, organisation: ORGANISATION_ID }) as unknown as Activity

const legacyLink = (url: string) => ({
  context: {},
  fieldLabel: 'Input',
  fieldPath: ['input'],
  locationPath: 'Input',
  parentEntity: 'Activity',
  url,
})

interface ReqMocks {
  beginTransaction: Mock
  commitTransaction: Mock
  create: Mock
  delete: Mock
  rollbackTransaction: Mock
  update: Mock
}

const makeReq = (
  dryRun: boolean,
  overrides: Partial<ReqMocks> = {},
): { mocks: ReqMocks; req: PayloadRequest } => {
  const mocks: ReqMocks = {
    beginTransaction: vi.fn().mockResolvedValue('tx-legacy'),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue({ id: CREATED_DOCUMENT_ID }),
    delete: vi.fn().mockResolvedValue({}),
    rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue({}),
    ...overrides,
  }

  const req = {
    context: {},
    json: async () => ({ dryRun }),
    payload: {
      create: mocks.create,
      db: {
        beginTransaction: mocks.beginTransaction,
        commitTransaction: mocks.commitTransaction,
        rollbackTransaction: mocks.rollbackTransaction,
      },
      delete: mocks.delete,
      find: vi.fn().mockResolvedValue({ docs: [activity(1), activity(2)] }),
      logger,
      update: mocks.update,
    },
    user: { id: 1, roles: ['admin'], selectedOrganisation: ORGANISATION_ID },
  } as unknown as PayloadRequest

  return { mocks, req }
}

const fetchAnswering = () =>
  vi.fn().mockImplementation(async (url: string) =>
    url === LIVE_URL
      ? { arrayBuffer: async () => new ArrayBuffer(4), ok: true }
      : { ok: false, status: 404, statusText: 'Not Found' },
  )

const handle = (req: PayloadRequest) => fetchLegacyDocsTransactional.handler(req)

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchAnswering())
  // Activity 1 links a file the legacy server no longer serves. Activity 2 links a live one.
  vi.mocked(scanLegacyLinks).mockImplementation(async (data) => [
    legacyLink((data as Activity).id === 1 ? DEAD_URL : LIVE_URL),
  ])
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchLegacyDocsTransactional', () => {
  // One dead legacy url must not stop a migration of a thousand activities. The document is
  // created before the transaction opens, and only the link rewrite runs inside it.
  test('skips a dead url, converts the live one, and completes the run', async () => {
    const { mocks, req } = makeReq(false)

    const response = await handle(req)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.statistics.errors).toMatchObject([
      { error: 'Failed to download: 404 Not Found', url: DEAD_URL },
    ])
    expect(body.statistics).toMatchObject({ activitiesProcessed: 2, documentsCreated: 1 })

    expect(mocks.create).toHaveBeenCalledTimes(1)
    expect(mocks.create.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.beginTransaction.mock.invocationCallOrder[0],
    )
    expect(mocks.update).toHaveBeenCalledTimes(1)
    expect(mocks.update.mock.calls[0][0]).toMatchObject({
      collection: 'activities',
      id: 2,
      req: { transactionID: 'tx-legacy' },
    })
    expect(mocks.commitTransaction).toHaveBeenCalledWith('tx-legacy')
    expect(mocks.delete).not.toHaveBeenCalled()
  })

  // The update is a Payload operation inside the transaction. Its failure rolls the transaction
  // back, the phase 1 documents are deleted, and the operator sees the cause and its status.
  test('rolls back, deletes the phase 1 documents and answers the error status when an update fails', async () => {
    const failure = Object.assign(new Error('duplicate key'), { status: 400 })
    const { mocks, req } = makeReq(false, { update: vi.fn().mockRejectedValue(failure) })

    const response = await handle(req)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Failed to fetch legacy documents: duplicate key',
    })
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith('tx-legacy')
    expect(mocks.delete).toHaveBeenCalledWith({
      collection: 'documents',
      id: CREATED_DOCUMENT_ID,
      overrideAccess: true,
      req,
    })
    expect(mocks.commitTransaction).not.toHaveBeenCalled()
  })

  // The drizzle adapter throws when no connection is free, and never answers null.
  test('deletes the phase 1 documents and answers 500 when the transaction cannot start', async () => {
    const { mocks, req } = makeReq(false, {
      beginTransaction: vi.fn().mockRejectedValue(new Error('cannot begin transaction')),
    })

    const response = await handle(req)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Failed to fetch legacy documents: cannot begin transaction',
    })
    expect(mocks.delete).toHaveBeenCalledWith({
      collection: 'documents',
      id: CREATED_DOCUMENT_ID,
      overrideAccess: true,
      req,
    })
    expect(mocks.update).not.toHaveBeenCalled()
  })

  test('downloads nothing and opens no transaction in a dry run', async () => {
    const { mocks, req } = makeReq(true)

    const response = await handle(req)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      dryRun: true,
      statistics: { activitiesProcessed: 2, totalLinksFound: 2 },
    })
    expect(fetch).not.toHaveBeenCalled()
    expect(mocks.beginTransaction).not.toHaveBeenCalled()
  })
})
