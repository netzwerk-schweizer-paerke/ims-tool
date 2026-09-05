/** The five collections that carry `adminSettingsField`, and therefore an `organisation`. */
export const TENANT_SCOPED_COLLECTIONS = [
  'activities',
  'task-flows',
  'task-lists',
  'documents',
  'media',
] as const

export type AdminStatsReport = {
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

export type LocaleCoverage = {
  locale: string
  /** Records that carry a name in this locale. */
  named: number
  total: number
}

export type ParkStatsRow = {
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
