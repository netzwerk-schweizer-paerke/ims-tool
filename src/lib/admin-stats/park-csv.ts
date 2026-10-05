import type { ParkStatsRow } from '@/lib/admin-stats/types'

/** The column titles, already translated into the admin language. */
export type ParkCsvHeaders = Record<
  | 'activeUsers'
  | 'activities'
  | 'documents'
  | 'language'
  | 'park'
  | 'storageBytes'
  | 'taskFlows'
  | 'taskLists'
  | 'users',
  string
>

/**
 * Excel in a Swiss locale splits a CSV on the semicolon, and reads UTF-8 only after a byte order
 * mark. Without both, the umlauts of a park name break and every row lands in one column.
 */
const SEPARATOR = ';'
const BOM = '﻿'

/** Build the park table as CSV (PIMS-93). Numbers stay raw, so a spreadsheet can sum them. */
export const parkStatsToCsv = (rows: readonly ParkStatsRow[], headers: ParkCsvHeaders): string => {
  const lines = [
    [
      headers.park,
      headers.language,
      headers.users,
      headers.activeUsers,
      headers.activities,
      headers.taskFlows,
      headers.taskLists,
      headers.documents,
      headers.storageBytes,
    ],
    ...rows.map((row) => [
      row.name,
      row.language,
      row.users,
      row.activeUsers,
      row.activities,
      row.taskFlows,
      row.taskLists,
      row.documents,
      row.storageBytes,
    ]),
  ]

  return BOM + lines.map((cells) => cells.map(toCell).join(SEPARATOR)).join('\r\n') + '\r\n'
}

/**
 * Quote a cell that holds a separator, a quote or a line break. Prefix a text cell that starts
 * like a formula, so a spreadsheet shows it instead of running it.
 */
const toCell = (value: number | string): string => {
  if (typeof value === 'number') {
    return String(value)
  }

  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value

  return /[";\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}
