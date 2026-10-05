/** The window of the "active users" column of the park table (PIMS-93). */
export const ACTIVE_USER_DAYS = 30

/** The five collections that carry `adminSettingsField`, and therefore an `organisation`. */
export const TENANT_SCOPED_COLLECTIONS = [
  'activities',
  'task-flows',
  'task-lists',
  'documents',
  'media',
] as const

export type AdminStatsReport = {
  /** Clones per source park and target park, recorded since PIMS-93. Largest first. */
  clones: ClonePairRow[]
  content: {
    documentsPublic: number
    perLocale: LocaleCoverage[]
    shareLinks: number
    // `media` is absent on purpose. The storage card counts those files, so a second total
    // would state the same number twice.
    totals: Record<Exclude<TenantScopedCollection, 'media'>, number>
  }
  parks: ParkStatsRow[]
  storage: {
    byCollection: StorageByCollection[]
    totalBytes: number
  }
  technical: TechnicalStats
  timestamp: string
  users: UserStats
}

export type ClonePairRow = {
  activities: number
  sourceName: string
  targetName: string
  taskFlows: number
  taskLists: number
}

export type LocaleCoverage = {
  locale: string
  /** Records that carry a name in this locale. */
  named: number
  total: number
}

export type ParkStatsRow = {
  /** Members whose last login falls within `ACTIVE_USER_DAYS`. */
  activeUsers: number
  activities: number
  documents: number
  id: number
  /** The organisation language, or an empty string when the record carries none. */
  language: string
  name: string
  storageBytes: number
  taskFlows: number
  taskLists: number
  users: number
}

export type StorageByCollection = {
  bytes: number
  collection: string
  files: number
}

export type TechnicalStats = {
  adminLanguages: string[]
  contentLocales: string[]
  environment: string
  nodeVersion: string
  s3Bucket: string
  s3Endpoint: string
}

export type TenantScopedCollection = (typeof TENANT_SCOPED_COLLECTIONS)[number]

export type UserStats = {
  /** Users who belong to no organisation at all. */
  noPark: number
  superAdmins: number
  total: number
}
