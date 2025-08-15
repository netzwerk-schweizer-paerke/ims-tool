import { PayloadRequest } from 'payload'
import fetch from 'node-fetch'
import { assert } from 'es-toolkit'
import { getErrorMessage } from './error-utils'

export interface PreloadedDocument {
  id: number
  filename: string
  mimeType: string
  filesize: number
  description?: string
  fileBuffer: Buffer
}

export interface DocumentPreloader {
  preloadedDocuments: Map<number, PreloadedDocument>
  errors: Array<{ documentId: number; error: string }>
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
    preloadedDocuments: new Map(),
    errors: [],
  }

  if (documentIds.length === 0) {
    return preloader
  }

  req.payload.logger.info({
    msg: 'Pre-loading documents for cloning',
    documentCount: documentIds.length,
    documentIds,
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
            msg: 'Document pre-loaded successfully',
            documentId,
            filename: preloadedDoc.filename,
            size: preloadedDoc.filesize,
          })
        } catch (error) {
          const errorMessage = getErrorMessage(error)
          preloader.errors.push({
            documentId,
            error: errorMessage,
          })

          req.payload.logger.warn({
            msg: 'Failed to pre-load document',
            documentId,
            error: errorMessage,
          })
        }
      }),
    )
  }

  req.payload.logger.info({
    msg: 'Document pre-loading completed',
    successCount: preloader.preloadedDocuments.size,
    errorCount: preloader.errors.length,
  })

  return preloader
}

async function preloadSingleDocument(
  req: PayloadRequest,
  documentId: number,
): Promise<PreloadedDocument> {
  // Get document metadata
  const sourceDocument = await req.payload.findByID({
    req,
    collection: 'documents',
    id: documentId,
    depth: 0,
  })

  if (!sourceDocument) {
    throw new Error(`Source document with ID ${documentId} not found`)
  }

  const { url } = sourceDocument
  if (!url) {
    throw new Error(`Document with ID ${documentId} has no file`)
  }

  // Download the file
  const serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const downloadUrl = `${serverUrl}${url}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  assert(process.env.PAYLOAD_API_KEY, 'PAYLOAD_API_KEY not set')

  try {
    const fileResponse = await fetch(downloadUrl, {
      headers: {
        Authorization: `users API-Key ${process.env.PAYLOAD_API_KEY}`,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!fileResponse.ok) {
      throw new Error(`HTTP error: ${fileResponse.status} ${fileResponse.statusText}`)
    }

    const arrayBuffer = await fileResponse.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    if (
      !fileBuffer ||
      !sourceDocument.filename ||
      !sourceDocument.mimeType ||
      !sourceDocument.filesize
    ) {
      throw new Error('Missing required file data')
    }

    return {
      id: sourceDocument.id,
      filename: sourceDocument.filename,
      mimeType: sourceDocument.mimeType,
      filesize: sourceDocument.filesize,
      description: sourceDocument.description || undefined,
      fileBuffer,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Creates a cloned document using pre-loaded file data
 * This runs within the transaction scope but without HTTP operations
 */
export async function createClonedDocumentFromPreloaded(
  req: PayloadRequest,
  preloadedDocument: PreloadedDocument,
  targetOrgId: number,
): Promise<{ id: number; collection: 'documents' }> {
  const filename = `${Date.now()}-${preloadedDocument.filename}`

  const file = {
    data: preloadedDocument.fileBuffer,
    name: filename,
    mimetype: preloadedDocument.mimeType,
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
    msg: 'Document created from pre-loaded data',
    originalId: preloadedDocument.id,
    newId: clonedDocument.id,
    filename,
  })

  return {
    id: clonedDocument.id,
    collection: 'documents',
  }
}
