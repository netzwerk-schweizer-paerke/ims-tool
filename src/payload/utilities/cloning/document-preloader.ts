import { PayloadRequest } from 'payload'

import { getErrorMessage } from './error-utils'
import { readDocumentFile } from './read-document-file'

export interface DocumentPreloader {
  errors: Array<{ documentId: number; error: string }>
  preloadedDocuments: Map<number, PreloadedDocument>
}

export interface PreloadedDocument {
  description?: string
  fileBuffer: Buffer
  filename: string
  filesize: number
  id: number
  mimeType: string
}

/**
 * Creates a cloned document using pre-loaded file data
 * This runs within the transaction scope but without HTTP operations
 */
export async function createClonedDocumentFromPreloaded(
  req: PayloadRequest,
  preloadedDocument: PreloadedDocument,
  targetOrgId: number,
): Promise<{ collection: 'documents'; id: number; }> {
  const filename = `${Date.now()}-${preloadedDocument.filename}`

  const file = {
    data: preloadedDocument.fileBuffer,
    mimetype: preloadedDocument.mimeType,
    name: filename,
    size: preloadedDocument.filesize,
  }

  const clonedDocument = await req.payload.create({
    collection: 'documents',
    data: {
      description: preloadedDocument.description,
      organisation: targetOrgId,
    },
    file,
    req: {
      ...req,
      context: {
        ...req.context,
        targetOrganisationId: targetOrgId,
      },
    },
  })

  req.payload.logger.debug({
    filename,
    msg: 'Document created from pre-loaded data',
    newId: clonedDocument.id,
    originalId: preloadedDocument.id,
  })

  return {
    collection: 'documents',
    id: clonedDocument.id,
  }
}

/**
 * Pre-downloads all documents needed for cloning operations
 * This moves HTTP operations outside the transaction scope to prevent timeouts
 */
export async function preloadDocuments(
  req: PayloadRequest,
  documentIds: number[],
): Promise<DocumentPreloader> {
  const preloader: DocumentPreloader = {
    errors: [],
    preloadedDocuments: new Map(),
  }

  if (documentIds.length === 0) {
    return preloader
  }

  req.payload.logger.info({
    documentCount: documentIds.length,
    documentIds,
    msg: 'Pre-loading documents for cloning',
  })

  // Remove duplicates
  const uniqueDocumentIds = Array.from(new Set(documentIds))

  // Process documents in batches to avoid overwhelming the server
  const batchSize = 5
  for (let i = 0; i < uniqueDocumentIds.length; i += batchSize) {
    const batch = uniqueDocumentIds.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (documentId) => {
        try {
          const preloadedDoc = await preloadSingleDocument(req, documentId)
          preloader.preloadedDocuments.set(documentId, preloadedDoc)

          req.payload.logger.debug({
            documentId,
            filename: preloadedDoc.filename,
            msg: 'Document pre-loaded successfully',
            size: preloadedDoc.filesize,
          })
        } catch (error) {
          const errorMessage = getErrorMessage(error)
          preloader.errors.push({
            documentId,
            error: errorMessage,
          })

          req.payload.logger.warn({
            documentId,
            error: errorMessage,
            msg: 'Failed to pre-load document',
          })
        }
      }),
    )
  }

  req.payload.logger.info({
    errorCount: preloader.errors.length,
    msg: 'Document pre-loading completed',
    successCount: preloader.preloadedDocuments.size,
  })

  return preloader
}

async function preloadSingleDocument(
  req: PayloadRequest,
  documentId: number,
): Promise<PreloadedDocument> {
  // Get document metadata
  const sourceDocument = await req.payload.findByID({
    collection: 'documents',
    depth: 0,
    id: documentId,
    req,
  })

  if (!sourceDocument) {
    throw new Error(`Source document with ID ${documentId} not found`)
  }

  const fileBuffer = await readDocumentFile(sourceDocument)

  if (!sourceDocument.filename || !sourceDocument.mimeType || !sourceDocument.filesize) {
    throw new Error('Missing required file data')
  }

  return {
    description: sourceDocument.description || undefined,
    fileBuffer,
    filename: sourceDocument.filename,
    filesize: sourceDocument.filesize,
    id: sourceDocument.id,
    mimeType: sourceDocument.mimeType,
  }
}
