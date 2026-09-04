import { describe, expect, test } from 'vitest'

import { calculatePercentComplete } from './calculate-percent-complete'

describe('calculatePercentComplete', () => {
  test('reports 100 when the source carries no files', () => {
    expect(calculatePercentComplete(0, 0)).toBe(100)
  })

  test('reports 100 when every file reached the clone', () => {
    expect(calculatePercentComplete(2, 2)).toBe(100)
  })

  test('reports the share when one file of two failed', () => {
    expect(calculatePercentComplete(2, 1)).toBe(50)
  })

  // The previous formula subtracted the error count from a total that already excluded it,
  // so two failures out of two reported -100.
  test('reports 0 when every file failed, never a negative value', () => {
    expect(calculatePercentComplete(2, 0)).toBe(0)
  })

  test('rounds to the nearest whole percent', () => {
    expect(calculatePercentComplete(3, 1)).toBe(33)
    expect(calculatePercentComplete(3, 2)).toBe(67)
  })

  test('clamps a cloned count that runs ahead of the source', () => {
    expect(calculatePercentComplete(1, 3)).toBe(100)
  })

  test('treats a negative source count as nothing to lose', () => {
    expect(calculatePercentComplete(-1, 0)).toBe(100)
  })
})
