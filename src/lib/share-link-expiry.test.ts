import { describe, expect, it } from 'vitest'

import {
  EXPIRY_MONTH_OPTIONS,
  expiryFromMonths,
  isExpiryMonths,
  isShareLinkExpired,
  MAX_EXPIRY_MONTHS,
} from '@/lib/share-link-expiry'

const NOW = new Date('2026-09-04T10:00:00.000Z')

describe('EXPIRY_MONTH_OPTIONS', () => {
  it('offers the month counts the dialog shows', () => {
    expect(EXPIRY_MONTH_OPTIONS).toEqual([1, 2, 3, 4, 6, 12])
  })

  it('takes the maximum from the longest option', () => {
    expect(MAX_EXPIRY_MONTHS).toBe(12)
  })
})

describe('isExpiryMonths', () => {
  it.each([...EXPIRY_MONTH_OPTIONS])('accepts the offered count %i', (months) => {
    expect(isExpiryMonths(months)).toBe(true)
  })

  it('rejects a whole month count the dialog does not offer', () => {
    expect(isExpiryMonths(5)).toBe(false)
    expect(isExpiryMonths(7)).toBe(false)
    expect(isExpiryMonths(11)).toBe(false)
  })

  it('rejects a value outside the range', () => {
    expect(isExpiryMonths(0)).toBe(false)
    expect(isExpiryMonths(-1)).toBe(false)
    expect(isExpiryMonths(13)).toBe(false)
    expect(isExpiryMonths(600)).toBe(false)
  })

  it('rejects a value that is not a whole number', () => {
    expect(isExpiryMonths(1.5)).toBe(false)
    expect(isExpiryMonths(NaN)).toBe(false)
    expect(isExpiryMonths(Infinity)).toBe(false)
  })

  it('rejects a value that is not a number', () => {
    expect(isExpiryMonths('3')).toBe(false)
    expect(isExpiryMonths(null)).toBe(false)
    expect(isExpiryMonths(undefined)).toBe(false)
    expect(isExpiryMonths({ months: 3 })).toBe(false)
  })
})

describe('expiryFromMonths', () => {
  it('adds the month count to the given instant', () => {
    expect(expiryFromMonths(1, NOW).toISOString()).toBe('2026-10-04T10:00:00.000Z')
    expect(expiryFromMonths(12, NOW).toISOString()).toBe('2027-09-04T10:00:00.000Z')
  })

  it('clamps a day the target month does not have', () => {
    const lastOfJanuary = new Date('2026-01-31T10:00:00.000Z')

    expect(expiryFromMonths(1, lastOfJanuary).toISOString()).toBe('2026-02-28T10:00:00.000Z')
  })
})

describe('isShareLinkExpired', () => {
  it('treats a row with no expiry as unlimited', () => {
    expect(isShareLinkExpired(null, NOW)).toBe(false)
    expect(isShareLinkExpired(undefined, NOW)).toBe(false)
    expect(isShareLinkExpired('', NOW)).toBe(false)
  })

  it('accepts a future instant as a string and as a date', () => {
    expect(isShareLinkExpired('2026-09-04T10:00:00.001Z', NOW)).toBe(false)
    expect(isShareLinkExpired(new Date('2026-12-01T00:00:00.000Z'), NOW)).toBe(false)
  })

  it('rejects a past instant as a string and as a date', () => {
    expect(isShareLinkExpired('2026-09-04T09:59:59.999Z', NOW)).toBe(true)
    expect(isShareLinkExpired(new Date('2026-08-01T00:00:00.000Z'), NOW)).toBe(true)
  })

  it('treats the exact instant as expired', () => {
    expect(isShareLinkExpired(NOW.toISOString(), NOW)).toBe(true)
  })

  it('fails closed on a value that does not parse', () => {
    expect(isShareLinkExpired('not a date', NOW)).toBe(true)
    expect(isShareLinkExpired(new Date('not a date'), NOW)).toBe(true)
  })
})
