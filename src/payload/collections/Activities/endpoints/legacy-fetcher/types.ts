// Export schema type for use in other modules
export type FetchLegacyDocsParams = {
  dryRun?: boolean
}

// Success payload of POST /api/activities/fetch-legacy-docs
export interface FetchLegacyDocsResponse {
  dryRun: boolean
  message: string
  statistics: LegacyDocsStatistics
  success: boolean
}

// Per-activity result inside the migration statistics
export interface LegacyDocsActivityBreakdown {
  documentsCreated: number
  failedConversions: number
  id: string
  linkDetails?: LegacyDocsLinkDetail[]
  linksConverted: number
  linksFound: number
  name: string
}

// One legacy link found in an activity, with its conversion outcome
export interface LegacyDocsLinkDetail {
  converted?: boolean
  error?: string
  fieldLabel: string
  locationPath: string
  parentEntity: string
  url: string
}

// Define statistics structure for legacy docs migration
export interface LegacyDocsStatistics {
  activitiesProcessed?: number
  activityBreakdown?: LegacyDocsActivityBreakdown[]
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
