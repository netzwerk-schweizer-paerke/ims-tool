import type { z } from 'zod'

// Define statistics structure for legacy docs migration
export interface LegacyDocsStatistics {
  startTime: number
  endTime?: number
  totalLinksFound: number
  documentsCreated: number
  linksConverted: number
  failedConversions: number
  errors: Array<{
    url: string
    error: string
    timestamp: number
  }>
  processedFields: number
  skippedFields: number
  activitiesProcessed?: number
  activityBreakdown?: Array<{
    id: string
    name: string
    linksFound: number
    linksConverted: number
    documentsCreated: number
    failedConversions: number
    linkDetails?: Array<{
      url: string
      parentEntity: string
      fieldLabel: string
      locationPath: string
      converted?: boolean
      error?: string
    }>
  }>
}

// Export schema type for use in other modules
export type FetchLegacyDocsParams = {
  dryRun?: boolean
}
