import { addMonths } from 'date-fns'

/** Every month count the share dialog offers, shortest first. A link with no count never expires. */
export const EXPIRY_MONTH_OPTIONS: readonly number[] = [1, 2, 3, 4, 6, 12]

/** The longest expiry a caller may choose. */
export const MAX_EXPIRY_MONTHS = Math.max(...EXPIRY_MONTH_OPTIONS)

/**
 * True when the value is a month count a caller may choose.
 *
 * The check reads the offered list, so the dialog and the server guard cannot disagree. The client
 * sends the month count and the server computes the instant. A browser with a wrong clock
 * therefore cannot mint a link that outlives the policy.
 */
export const isExpiryMonths = (value: unknown): value is number =>
  typeof value === 'number' && EXPIRY_MONTH_OPTIONS.includes(value)

/** The instant a link created at `now` stops working. */
export const expiryFromMonths = (months: number, now: Date): Date => addMonths(now, months)

/**
 * True when the link no longer opens.
 *
 * A row with no `expiresAt` never expires. A stored value that does not parse counts as expired,
 * because this answer gates public access and must fail closed.
 */
export const isShareLinkExpired = (
  expiresAt: Date | null | string | undefined,
  now: Date,
): boolean => {
  // A Date is always truthy, so this rejects only null, undefined and the empty string.
  if (!expiresAt) {
    return false
  }

  const instant = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)

  return Number.isNaN(instant.getTime()) || instant.getTime() <= now.getTime()
}
