import { describe, expect, it } from 'vitest'

import { coversWholeBucket } from '@/lib/s3-orphan-safety'

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
