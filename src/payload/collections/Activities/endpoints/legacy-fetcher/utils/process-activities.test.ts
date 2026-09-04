import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest'

// The two stubs keep the network and the legacy scan out of the run. Each test chooses what the
// scan finds, and whether the download succeeds.
vi.mock('./download-external-document', () => ({
  downloadExternalDocument: vi.fn(),
}))
vi.mock('./scan-legacy-links', () => ({
  scanLegacyLinks: vi.fn(),
}))

import type { Activity } from '@/payload-types'

import { downloadExternalDocument } from './download-external-document'
import { prepareActivities, type PreparedActivity, rewriteActivities } from './process-activities'
import { scanLegacyLinks } from './scan-legacy-links'
import { FetchLegacyDocsTracker } from './statistics-tracker'

const LEGACY_URL = 'https://parcs-ims.ch/files/plan.pdf'

const activity = (id: number): Activity =>
  ({ id, name: `Activity ${id}`, organisation: 11 }) as unknown as Activity

const legacyLink = () => ({
  context: {},
  fieldLabel: 'Input',
  fieldPath: ['input'],
  locationPath: 'Input',
  parentEntity: 'Activity',
  url: LEGACY_URL,
})

const makeReq = (update: Mock = vi.fn()): PayloadRequest =>
  ({ payload: { update }, transactionID: 'tx-legacy' }) as unknown as PayloadRequest

/** The endpoint seeds every counter before the run, so `increment` has a number to add to. */
const freshTracker = () => {
  const tracker = new FetchLegacyDocsTracker()
  tracker.initializeStatistics({
    activitiesProcessed: 0,
    activityBreakdown: [],
    documentsCreated: 0,
    errors: [],
    failedConversions: 0,
    linksConverted: 0,
    processedFields: 0,
    skippedFields: 0,
    startTime: Date.now(),
    totalLinksFound: 0,
  })
  return tracker
}

const prepare = (activities: Activity[], tracker = freshTracker(), dryRun = false) =>
  prepareActivities({ activities, dryRun, req: makeReq(), tracker })

const preparedWith = (id: number, documentMap: Map<string, number>): PreparedActivity => ({
  activity: activity(id),
  documentMap,
  stats: {
    documentsCreated: documentMap.size,
    failedConversions: 0,
    id: String(id),
    linksConverted: documentMap.size,
    linksFound: 1,
    name: `Activity ${id}`,
  },
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(scanLegacyLinks).mockResolvedValue([legacyLink()])
})

describe('prepareActivities', () => {
  test('creates one document per url and marks the link converted', async () => {
    vi.mocked(downloadExternalDocument).mockResolvedValue(77)
    const tracker = freshTracker()

    const prepared = await prepare([activity(1)], tracker)

    expect(prepared.createdDocumentIds).toEqual([77])
    expect(Array.from(prepared.activities[0].documentMap)).toEqual([[LEGACY_URL, 77]])
    expect(prepared.activities[0].stats).toMatchObject({ documentsCreated: 1, linksConverted: 1 })
    expect(prepared.activities[0].stats.linkDetails?.[0].converted).toBe(true)
    expect(tracker.getStatistics()).toMatchObject({ activitiesProcessed: 1, documentsCreated: 1 })
    expect(tracker.getStatistics().activityBreakdown).toHaveLength(1)
  })

  test('downloads a url two activities share once', async () => {
    vi.mocked(downloadExternalDocument).mockResolvedValue(77)

    const prepared = await prepare([activity(1), activity(2)])

    expect(downloadExternalDocument).toHaveBeenCalledTimes(1)
    expect(prepared.createdDocumentIds).toEqual([77])
    expect(prepared.activities[1].documentMap.get(LEGACY_URL)).toBe(77)
  })

  // A dead legacy url answers null with no transaction open. The link keeps its url, and the
  // next activity still runs.
  test('skips a dead url and continues with the next activity', async () => {
    vi.mocked(downloadExternalDocument).mockResolvedValue(null)
    const tracker = freshTracker()

    const prepared = await prepare([activity(1), activity(2)], tracker)

    expect(scanLegacyLinks).toHaveBeenCalledTimes(2)
    expect(prepared.activities).toHaveLength(2)
    expect(prepared.createdDocumentIds).toEqual([])
    expect(prepared.activities[0].documentMap.size).toBe(0)
    expect(prepared.activities[0].stats.linkDetails?.[0].converted).toBe(false)
    expect(tracker.getStatistics()).toMatchObject({ activitiesProcessed: 2, documentsCreated: 0 })
  })

  test('downloads nothing in a dry run, and still counts the links', async () => {
    const tracker = freshTracker()

    const prepared = await prepare([activity(1)], tracker, true)

    expect(downloadExternalDocument).not.toHaveBeenCalled()
    expect(prepared.activities[0].documentMap.size).toBe(0)
    expect(tracker.getStatistics()).toMatchObject({ activitiesProcessed: 1, totalLinksFound: 1 })
  })

  test('records an activity without an organisation and skips it', async () => {
    const tracker = freshTracker()
    const orphan = { id: 3, name: 'Orphan', organisation: null } as unknown as Activity

    const prepared = await prepare([orphan], tracker)

    expect(prepared.activities).toHaveLength(0)
    expect(tracker.getStatistics().errors).toMatchObject([{ url: 'Activity: Orphan' }])
  })
})

describe('rewriteActivities', () => {
  test('rewrites and updates each activity that received a document', async () => {
    const update = vi.fn().mockResolvedValue({})
    const req = makeReq(update)
    const tracker = freshTracker()

    await rewriteActivities({
      prepared: [preparedWith(1, new Map([[LEGACY_URL, 77]]))],
      req,
      tracker,
    })

    expect(update.mock.calls[0][0]).toMatchObject({ collection: 'activities', id: 1, req })
    expect(tracker.getStatistics()).toMatchObject({ linksConverted: 1 })
  })

  test('writes nothing for an activity whose links all failed', async () => {
    const update = vi.fn()

    await rewriteActivities({
      prepared: [preparedWith(1, new Map())],
      req: makeReq(update),
      tracker: freshTracker(),
    })

    expect(update).not.toHaveBeenCalled()
  })

  // The update runs inside the endpoint's transaction, and Payload rolls that transaction back
  // when the update fails. The next activity would then write on its own connection.
  test('rejects when an update fails, records the activity, and never reaches the next one', async () => {
    const failure = new Error('duplicate key')
    const update = vi.fn().mockRejectedValue(failure)
    const tracker = freshTracker()

    await expect(
      rewriteActivities({
        prepared: [
          preparedWith(1, new Map([[LEGACY_URL, 77]])),
          preparedWith(2, new Map([[LEGACY_URL, 77]])),
        ],
        req: makeReq(update),
        tracker,
      }),
    ).rejects.toBe(failure)

    expect(update).toHaveBeenCalledTimes(1)
    expect(tracker.getStatistics().errors).toMatchObject([
      { error: 'duplicate key', url: 'Activity: Activity 1' },
    ])
  })
})
