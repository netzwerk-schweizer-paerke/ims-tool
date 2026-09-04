import { describe, expect, it } from 'vitest'

import { formatBytes, formatCount, toShare } from '@/lib/admin-stats/format'

describe('formatBytes', () => {
  it('keeps a value under one kibibyte in bytes', () => {
    expect(formatBytes(0, 'en')).toBe('0 B')
    expect(formatBytes(1023, 'en')).toBe('1,023 B')
  })

  it('steps up in binary units', () => {
    expect(formatBytes(1024, 'en')).toBe('1 KB')
    expect(formatBytes(1024 * 1024 * 3.5, 'en')).toBe('3.5 MB')
  })

  it('stops at the largest unit it knows', () => {
    expect(formatBytes(1024 ** 6, 'en')).toContain('TB')
  })

  it('reads a negative or invalid size as zero', () => {
    expect(formatBytes(-5, 'en')).toBe('0 B')
    expect(formatBytes(NaN, 'en')).toBe('0 B')
  })
})

describe('formatCount', () => {
  it('groups with the locale the caller names', () => {
    expect(formatCount(1_234_567,'en')).toBe('1,234,567')
    expect(formatCount(1_234_567,'de')).toBe('1.234.567')
  })

  it('reads an invalid count as zero', () => {
    expect(formatCount(Infinity, 'en')).toBe('0')
  })
})

describe('toShare', () => {
  it('divides the value by the total', () => {
    expect(toShare(25, 100)).toBe(0.25)
  })

  it('returns zero for a total of zero', () => {
    expect(toShare(5, 0)).toBe(0)
  })

  it('clamps a value above the total to one', () => {
    expect(toShare(120, 100)).toBe(1)
  })
})
