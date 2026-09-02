import type { LegacyDocsStatistics } from '../types'

// Custom error creator
export function createCloneError(
  message: string,
  details: unknown,
  stats?: LegacyDocsStatistics,
) {
  return {
    details,
    error: message,
    ...(stats && { statistics: stats }),
  }
}
