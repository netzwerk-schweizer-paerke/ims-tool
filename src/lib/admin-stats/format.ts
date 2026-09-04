const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

/**
 * Format a byte count for a reader, in binary steps.
 *
 * The locale comes from the caller, never from the runtime default. A server component runs
 * under the container locale, and a client component runs under the browser locale. Neither
 * one follows the Payload admin language.
 */
export const formatBytes = (bytes: number, locale: string): string => {
  const safe = toSafeNumber(bytes)

  if (safe < 1024) {
    return `${formatCount(safe, locale)} ${BYTE_UNITS[0]}`
  }

  const step = Math.min(Math.floor(Math.log(safe) / Math.log(1024)), BYTE_UNITS.length - 1)
  const value = safe / 1024 ** step

  return `${value.toLocaleString(locale, { maximumFractionDigits: 1 })} ${BYTE_UNITS[step]}`
}

export const formatCount = (value: number, locale: string): string =>
  toSafeNumber(value).toLocaleString(locale)

/** A share of a total, from 0 to 1. A total of 0 has no share, so it reads as 0. */
export const toShare = (value: number, total: number): number => {
  const safeTotal = toSafeNumber(total)

  if (safeTotal <= 0) {
    return 0
  }

  return Math.min(toSafeNumber(value) / safeTotal, 1)
}

const toSafeNumber = (value: number): number =>
  Number.isFinite(value) && value > 0 ? value : 0
