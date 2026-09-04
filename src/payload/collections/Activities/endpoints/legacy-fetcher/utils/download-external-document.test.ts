import type { PayloadRequest } from 'payload'

import { afterEach, describe, expect, type Mock, test, vi } from 'vitest'

import {
  DOWNLOAD_TIMEOUT_MS,
  downloadExternalDocument,
  MAX_DOWNLOAD_BYTES,
} from './download-external-document'
import { FetchLegacyDocsTracker } from './statistics-tracker'

const LEGACY_URL = 'https://parcs-ims.ch/files/plan.pdf'
const ORGANISATION_ID = 11

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }

const makeReq = (create: Mock): PayloadRequest =>
  ({ payload: { create, logger } }) as unknown as PayloadRequest

const fetchAnswering = (response: Partial<Response>) => vi.fn().mockResolvedValue(response)

/** A host that accepts the connection and never answers. The promise settles on abort alone. */
const fetchHanging = () =>
  vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
      }),
  )

const fileResponse = (): Response => new Response(new Uint8Array(4), { status: 200 })

/** One megabyte, enqueued again and again until the body crosses the cap by one chunk. */
const oversizedBody = (): ReadableStream<Uint8Array> => {
  const megabyte = new Uint8Array(1024 * 1024)
  let sent = 0

  return new ReadableStream({
    pull(controller) {
      if (sent > MAX_DOWNLOAD_BYTES) {
        controller.close()
        return
      }

      controller.enqueue(megabyte)
      sent += megabyte.byteLength
    },
  })
}

const download = (
  req: PayloadRequest,
  tracker = new FetchLegacyDocsTracker(),
  url = LEGACY_URL,
) => downloadExternalDocument(url, ORGANISATION_ID, req, tracker)

afterEach(() => {
  vi.useRealTimers()
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
      file: {
        mimetype: 'application/pdf',
        name: expect.stringMatching(/^legacy_\d+_plan\.pdf$/),
        size: 4,
      },
      // The create runs the Documents afterRead hook, so the request carries its opt-out.
      req: { ...req, context: { skipDocumentUsage: true } },
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

  // A host that accepts the connection and never answers would otherwise hold the request for
  // undici's 300-second idle timeout, once per link of the migration.
  test('gives up on a host that never answers when the timeout fires', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const fetchMock = fetchHanging()
    vi.stubGlobal('fetch', fetchMock)
    const create = vi.fn()
    const tracker = new FetchLegacyDocsTracker()

    const pending = download(makeReq(create), tracker)
    await vi.advanceTimersByTimeAsync(DOWNLOAD_TIMEOUT_MS)

    await expect(pending).resolves.toBeNull()
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
    expect(create).not.toHaveBeenCalled()
    expect(tracker.getStatistics().errors).toMatchObject([
      { error: `Download timed out after ${DOWNLOAD_TIMEOUT_MS} ms`, url: LEGACY_URL },
    ])
  })

  test('clears the timer once the download completes', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vi.stubGlobal('fetch', fetchAnswering(fileResponse()))

    await expect(download(makeReq(vi.fn().mockResolvedValue({ id: 77 })))).resolves.toBe(77)

    expect(vi.getTimerCount()).toBe(0)
  })

  test('refuses a body that crosses the size cap, before the create', async () => {
    vi.stubGlobal('fetch', fetchAnswering(new Response(oversizedBody(), { status: 200 })))
    const create = vi.fn()
    const tracker = new FetchLegacyDocsTracker()

    await expect(download(makeReq(create), tracker)).resolves.toBeNull()

    expect(create).not.toHaveBeenCalled()
    expect(tracker.getStatistics().errors).toMatchObject([
      { error: `Download exceeds ${MAX_DOWNLOAD_BYTES} bytes`, url: LEGACY_URL },
    ])
  })

  test('refuses a declared length above the cap, before the first byte', async () => {
    const declared = MAX_DOWNLOAD_BYTES + 1
    vi.stubGlobal(
      'fetch',
      fetchAnswering(
        new Response(new Uint8Array(4), {
          headers: { 'content-length': String(declared) },
          status: 200,
        }),
      ),
    )
    const create = vi.fn()
    const tracker = new FetchLegacyDocsTracker()

    await expect(download(makeReq(create), tracker)).resolves.toBeNull()

    expect(create).not.toHaveBeenCalled()
    expect(tracker.getStatistics().errors[0].error).toBe(
      `Download exceeds ${MAX_DOWNLOAD_BYTES} bytes: ${declared} bytes declared`,
    )
  })
})
