import { CollectionSlug } from 'payload'

type SharedStats = {
  id: number | string
  name: string
  collection: CollectionSlug | null
  relatedEntitiesCount: number
  documentFilesCount: number
  publicDocumentFilesCount: number
  blocksCount: number
  itemsCount: number
  filesCount: number
  documentsCloned?: number
  richTextDocumentsFound?: number
  richTextDocumentsCloned?: number
  publicDocumentsFound?: number
  publicDocumentsPreserved?: number
  totalDocumentsFound?: number
  totalDocumentsCloned?: number
  uniqueDocumentsFound?: number
  uniqueDocumentsCloned?: number
  relatedItemsCloned?: Record<string, number>
  customStats?: Record<string, number>
  fieldsPopulated?: number
}

export type MissingDocumentFileError = {
  documentId: number
  documentName: string
  fileName: string
  error: string
  usageLocation: string
}

export type OtherErrors = {
  errorMessage: string
  op: string
}

export type GenericCloneStatisticsFinalized = {
  entities: GenericCloneStatistics[]
  aggregated: GenericCloneStatistics
  successLevel: 'success' | 'partial' | 'fail'
}

export interface GenericCloneStatistics {
  source: SharedStats
  cloned: SharedStats
  percentComplete: number
  errors: {
    missingDocumentFiles: MissingDocumentFileError[]
    otherErrors: OtherErrors[]
  }
}

export interface CloneResponse {
  message: string
  documentId: number | string
  statistics: GenericCloneStatistics
}

export type RichTextProcessingResult = {
  content: any
  errors: MissingDocumentFileError[]
}
