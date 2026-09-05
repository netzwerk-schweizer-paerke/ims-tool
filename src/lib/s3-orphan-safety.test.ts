import { describe, expect, it } from 'vitest'

import {
  coversWholeBucket,
  isTooRecentToDelete,
  ORPHAN_MIN_AGE_MS,
  referenceScanFailed,
} from '@/lib/s3-orphan-safety'

describe('coversWholeBucket', () => {
  it('refuses a request that names every object', () => {
    expect(coversWholeBucket(1777, 1777)).toBe(true)
  })

  it('refuses a request that names more keys than the bucket holds', () => {
    expect(coversWholeBucket(1778, 1777)).toBe(true)
  })

  it('allows a request that leaves at least one object', () => {
    expect(coversWholeBucket(1776, 1777)).toBe(false)
    expect(coversWholeBucket(1, 2)).toBe(false)
  })

  it('allows an empty bucket, because nothing is at risk', () => {
    expect(coversWholeBucket(0, 0)).toBe(false)
  })
})

describe('referenceScanFailed', () => {
  it('refuses when the scan collected references and matched none', () => {
    expect(referenceScanFailed(0, 942)).toBe(true)
  })

  it('refuses regardless of how few keys the caller asked for', () => {
    // The chunked caller: 5 keys at a time defeats a request-size test, never this one.
    expect(referenceScanFailed(0, 1)).toBe(true)
  })

  it('allows a scan that matched at least one reference', () => {
    expect(referenceScanFailed(1, 942)).toBe(false)
    expect(referenceScanFailed(942, 942)).toBe(false)
  })

  it('allows an installation that holds no references at all', () => {
    expect(referenceScanFailed(0, 0)).toBe(false)
  })
})

describe('isTooRecentToDelete', () => {
  const now = new Date('2026-09-05T12:00:00.000Z')
  const at = (offsetMs: number) => new Date(now.getTime() - offsetMs)

  it('refuses an object the bucket wrote inside the upload window', () => {
    // The row of an upload in flight is not committed yet, so its object reads as an orphan.
    expect(isTooRecentToDelete(at(0), now)).toBe(true)
    expect(isTooRecentToDelete(at(60_000), now)).toBe(true)
    expect(isTooRecentToDelete(at(ORPHAN_MIN_AGE_MS - 1), now)).toBe(true)
  })

  it('allows an object that is older than the window', () => {
    expect(isTooRecentToDelete(at(ORPHAN_MIN_AGE_MS), now)).toBe(false)
    expect(isTooRecentToDelete(at(ORPHAN_MIN_AGE_MS * 30), now)).toBe(false)
  })

  it('refuses an object with a timestamp in the future', () => {
    // A skewed bucket clock must never make an object look old enough.
    expect(isTooRecentToDelete(new Date(now.getTime() + 60_000), now)).toBe(true)
  })
})
