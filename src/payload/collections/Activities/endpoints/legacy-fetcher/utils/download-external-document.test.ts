import type { PayloadRequest } from 'payload'

import { afterEach, describe, expect, type Mock, test, vi } from 'vitest'

import { downloadExternalDocument } from './download-external-document'
import { FetchLegacyDocsTracker } from './statistics-tracker'

const LEGACY_URL = 'https://parcs-ims.ch/files/plan.pdf'
const ORGANISATION_ID = 11

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }

const makeReq = (create: Mock): PayloadRequest =>
  ({ payload: { create, logger } }) as unknown as PayloadRequest

const fetchAnswering = (response: Partial<Response>) => vi.fn().mockResolvedValue(response)

const fileResponse = (): Partial<Response> => ({
  arrayBuffer: async () => new ArrayBuffer(4),
  ok: true,
})

const download = (
  req: PayloadRequest,
  tracker = new FetchLegacyDocsTracker(),
  url = LEGACY_URL,
) => downloadExternalDocument(url, ORGANISATION_ID, req, tracker)

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('downloadExternalDocument', () => {
  test('returns the id of the created document', async () => {
    vi.stubGlobal('fetch', fetchAnswering(fileResponse()))
    const create = vi.fn().mockResolvedValue({ id: 77 })
    const req = makeReq(create)

    await expect(download(req)).resolves.toBe(77)

    expect(create.mock.calls[0][0]).toMatchObject({
      collection: 'documents',
      data: { name: 'plan.pdf', organisation: ORGANISATION_ID },
      file: { mimetype: 'application/pdf', name: expect.stringMatching(/^legacy_\d+_plan\.pdf$/) },
      req,
    })
  })

  // The create runs in phase 1, with no transaction open. A failure leaves nothing to roll
  // back, so the link is skipped like a dead url and the run continues.
  test('skips a document the create rejects, and keeps the url on the tracker', async () => {
    vi.stubGlobal('fetch', fetchAnswering(fileResponse()))
    const tracker = new FetchLegacyDocsTracker()

    await expect(
      download(makeReq(vi.fn().mockRejectedValue(new Error('duplicate key'))), tracker),
    ).resolves.toBeNull()

    expect(tracker.getStatistics().errors).toMatchObject([
      { error: 'duplicate key', url: LEGACY_URL },
    ])
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'duplicate key', url: LEGACY_URL }),
      expect.any(String),
    )
  })

  // No Payload call runs before the download, so the transaction is still healthy and the link
  // is skipped. One dead legacy url must not stop a migration of a thousand activities.
  test('skips a file the legacy server does not answer, and keeps the url on the tracker', async () => {
    vi.stubGlobal('fetch', fetchAnswering({ ok: false, status: 404, statusText: 'Not Found' }))
    const create = vi.fn()
    const tracker = new FetchLegacyDocsTracker()

    await expect(download(makeReq(create), tracker)).resolves.toBeNull()

    expect(create).not.toHaveBeenCalled()
    expect(tracker.getStatistics().errors).toMatchObject([
      { error: 'Failed to download: 404 Not Found', url: LEGACY_URL },
    ])
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ url: LEGACY_URL }),
      expect.any(String),
    )
  })

  test('skips a url that fails validation, without a network call', async () => {
    const fetchMock = fetchAnswering(fileResponse())
    vi.stubGlobal('fetch', fetchMock)
    const create = vi.fn()
    const tracker = new FetchLegacyDocsTracker()

    await expect(
      download(makeReq(create), tracker, 'https://other.example/files/plan.pdf'),
    ).resolves.toBeNull()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
    expect(tracker.getStatistics().errors[0].error).toContain('Domain not in allowed list')
  })
})
