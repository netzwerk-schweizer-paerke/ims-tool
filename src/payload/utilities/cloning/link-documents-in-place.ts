import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

/**
 * The phase 1 result of a link-mode paste (PIMS-83). Every document maps to itself, so the strip
 * code keeps the original documents. The pipeline must never delete these ids on a rollback.
 */
export const linkDocumentsInPlace = (documentIds: readonly number[]): DocumentPreloader => ({
  clonedDocumentIds: new Map(documentIds.map((id) => [id, id])),
  errors: [],
  preloadedDocuments: new Map(),
})
