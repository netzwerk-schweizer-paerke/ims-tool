import { CollectionSlug } from 'payload'

export interface CloneResponse {
  documentId: number | string
  message: string
  statistics: GenericCloneStatistics
}

export interface GenericCloneStatistics {
  cloned: SharedStats
  errors: {
    missingDocumentFiles: MissingDocumentFileError[]
    otherErrors: OtherErrors[]
  }
  percentComplete: number
  source: SharedStats
}

export type GenericCloneStatisticsFinalized = {
  aggregated: GenericCloneStatistics
  entities: GenericCloneStatistics[]
  successLevel: 'fail' | 'partial' | 'success'
}

export type MissingDocumentFileError = {
  documentId: number
  documentName: string
  error: string
  fileName: string
  usageLocation: string
}

export type OtherErrors = {
  errorMessage: string
  op: string
}

export type RichTextProcessingResult = {
  content: any
  errors: MissingDocumentFileError[]
}

type SharedStats = {
  blocksCount: number
  collection: CollectionSlug | null
  customStats?: Record<string, number>
  documentFilesCount: number
  documentsCloned?: number
  fieldsPopulated?: number
  filesCount: number
  id: number | string
  itemsCount: number
  name: string
  publicDocumentFilesCount: number
  publicDocumentsFound?: number
  publicDocumentsPreserved?: number
  relatedEntitiesCount: number
  relatedItemsCloned?: Record<string, number>
  richTextDocumentsCloned?: number
  richTextDocumentsFound?: number
  totalDocumentsCloned?: number
  totalDocumentsFound?: number
  uniqueDocumentsCloned?: number
  uniqueDocumentsFound?: number
}
