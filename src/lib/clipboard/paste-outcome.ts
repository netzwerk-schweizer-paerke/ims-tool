import type { GenericCloneStatisticsFinalized } from '@/payload/utilities/cloning/types'

/**
 * What the user sees after a paste (PIMS-83). A complete clone gets a toast. A clone with
 * problems, and a refused paste, get the result dialog.
 */
export type PasteOutcome =
  | { details: string[]; error: string; kind: 'failed' }
  | { kind: 'issues'; results: GenericCloneStatisticsFinalized }
  | { kind: 'success' }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isResults = (value: unknown): value is GenericCloneStatisticsFinalized =>
  isRecord(value) && Array.isArray(value.entities) && typeof value.successLevel === 'string'

/** Reads the answer of a clone or a paste-block request. The body is untrusted JSON. */
export const pasteOutcome = (ok: boolean, status: number, body: unknown): PasteOutcome => {
  if (!ok) {
    const error = isRecord(body) && typeof body.error === 'string' ? body.error : `HTTP ${status}`
    const details =
      isRecord(body) && Array.isArray(body.details) ? body.details.map(String) : []

    return { details, error, kind: 'failed' }
  }

  const results = isRecord(body) ? body.results : undefined

  // An answer without statistics carries no problem list, so the paste reads as complete.
  if (!isResults(results) || results.successLevel === 'success') {
    return { kind: 'success' }
  }

  return { kind: 'issues', results }
}

/**
 * The item the paste added. The page marks every pasteable item with `data-paste-key`, and the
 * paste reads the keys before it starts. A new id after the refresh is the copy.
 */
export const findNewPasteKey = (before: ReadonlySet<string>, after: readonly string[]) =>
  after.find((key) => !before.has(key)) ?? null
