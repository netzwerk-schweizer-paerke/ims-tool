import type { z } from 'zod'

// Export schema type for use in other modules
export type FetchLegacyDocsParams = {
  dryRun?: boolean
}

// Define statistics structure for legacy docs migration
export interface LegacyDocsStatistics {
  activitiesProcessed?: number
  activityBreakdown?: Array<{
    documentsCreated: number
    failedConversions: number
    id: string
    linkDetails?: Array<{
      converted?: boolean
      error?: string
      fieldLabel: string
      locationPath: string
      parentEntity: string
      url: string
    }>
    linksConverted: number
    linksFound: number
    name: string
  }>
  documentsCreated: number
  endTime?: number
  errors: Array<{
    error: string
    timestamp: number
    url: string
  }>
  failedConversions: number
  linksConverted: number
  processedFields: number
  skippedFields: number
  startTime: number
  totalLinksFound: number
}
