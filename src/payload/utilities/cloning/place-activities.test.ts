import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, test, vi } from 'vitest'

// The advisory lock needs a real Postgres session. Here only the reads and the writes count.
vi.mock('@/payload/utilities/cloning/lock-activity', () => ({
  lockParkOrderForPaste: vi.fn(),
}))

import { lockParkOrderForPaste } from '@/payload/utilities/cloning/lock-activity'
import { placeActivities, resolveActivityAnchor } from '@/payload/utilities/cloning/place-activities'

const PARK_ID = 11

const makeReq = (anchor: unknown, stored: Array<{ docOrder: null | number; id: number }> = []) => {
  const findByID = vi.fn().mockResolvedValue(anchor)
  const find = vi.fn().mockResolvedValue({ docs: stored })
  const updateOne = vi.fn().mockResolvedValue(undefined)
  const req = {
    payload: { db: { updateOne }, find, findByID },
    transactionID: 'tx',
  } as unknown as PayloadRequest

  return { find, findByID, req, updateOne }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('resolveActivityAnchor', () => {
  const position = { anchorActivityId: 40, placement: 'after' as const }

  test('answers the band of an anchor in the target park', async () => {
    const { findByID, req } = makeReq({ organisation: PARK_ID, variant: 'strategyActivity' })

    await expect(resolveActivityAnchor(req, position, PARK_ID)).resolves.toBe('strategyActivity')
    // A missing anchor must answer null, never throw, or a later transaction dies with it.
    expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ disableErrors: true, id: 40 }))
  })

  test('refuses an anchor of another park', async () => {
    const { req } = makeReq({ organisation: { id: 6 }, variant: 'standard' })

    await expect(resolveActivityAnchor(req, position, PARK_ID)).rejects.toMatchObject({
      status: 400,
    })
  })

  test('answers 404 for a missing anchor', async () => {
    const { req } = makeReq(null)

    await expect(resolveActivityAnchor(req, position, PARK_ID)).rejects.toMatchObject({
      status: 404,
    })
  })
})

describe('placeActivities', () => {
  const stored = [
    { docOrder: 1, id: 10 },
    { docOrder: 2, id: 40 },
    { docOrder: 3, id: 50 },
    { docOrder: 4, id: 77 },
  ]

  test('gives the clone the band and renumbers the park around the anchor', async () => {
    const { find, req, updateOne } = makeReq(null, stored)

    await placeActivities({
      newIds: [77],
      organisationId: PARK_ID,
      position: { anchorActivityId: 40, placement: 'before' },
      req,
      variant: 'supportActivity',
    })

    expect(lockParkOrderForPaste).toHaveBeenCalledWith(req, PARK_ID)
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organisation: { equals: PARK_ID } } }),
    )
    expect(updateOne.mock.calls.map(([args]) => [args.id, args.data])).toEqual([
      [77, { variant: 'supportActivity' }],
      [77, { docOrder: 2 }],
      [40, { docOrder: 3 }],
      [50, { docOrder: 4 }],
    ])
    for (const [args] of updateOne.mock.calls) {
      expect(args.req).toBe(req)
    }
  })

  test('writes no order when the clone already sits after the last anchor', async () => {
    const { req, updateOne } = makeReq(null, stored)

    await placeActivities({
      newIds: [77],
      organisationId: PARK_ID,
      position: { anchorActivityId: 50, placement: 'after' },
      req,
      variant: 'standard',
    })

    expect(updateOne).toHaveBeenCalledTimes(1)
    expect(updateOne).toHaveBeenCalledWith(expect.objectContaining({ data: { variant: 'standard' } }))
  })
})
