import { PayloadRequest } from 'payload'

import { getErrorMessage } from './error-utils'
import { readDocumentFile } from './read-document-file'

export interface DocumentPreloader {
  /** Source document id to the id of its copy in the target organisation. */
  clonedDocumentIds: Map<number, number>
  errors: PreloadError[]
  /** The metadata of each source document phase 1 read. The bytes are not retained. */
  preloadedDocuments: Map<number, PreloadedDocument>
}

export interface PreloadedDocument {
  description?: string
  filename: string
  filesize: number
  id: number
  mimeType: string
}

/** One document phase 1 could not copy, with the metadata it read before the failure. */
export interface PreloadError {
  documentId: number
  documentName?: string
  error: string
  fileName?: string
}

/** Phase 1 copies this many documents at once. One create costs seconds, so the batch stays small. */
const BATCH_SIZE = 5

/**
 * Answers the failure phase 1 recorded for a document.
 *
 * A document the scan never reached has no entry. It gets a synthesized one, so every caller
 * reports the same shape.
 */
export const describePreloadFailure = (
  preloader: DocumentPreloader,
  documentId: number,
): PreloadError =>
  preloader.errors.find((entry) => entry.documentId === documentId) ?? {
    documentId,
    error: `Document ${documentId} was not copied before the transaction opened`,
  }

/**
 * Answers the id of the copy phase 1 made, or throws with the failure phase 1 recorded.
 *
 * The lookup runs no Payload operation. A throw here leaves the transaction intact, so the
 * caller records the failure and continues.
 */
export const resolvePreloadedDocumentId = (
  preloader: DocumentPreloader,
  documentId: number,
): number => {
  const clonedId = preloader.clonedDocumentIds.get(documentId)

  if (clonedId !== undefined) {
    return clonedId
  }

  throw new Error(describePreloadFailure(preloader, documentId).error)
}

/**
 * Phase 1 of a clone. Reads each source document, downloads its file from the bucket and creates
 * the copy in the target organisation.
 *
 * No transaction is open here. Each copy commits on its own connection, and a failure is recorded
 * and skipped, so one missing file never stops the other documents or the clone.
 */
export async function preloadDocuments(
  req: PayloadRequest,
  documentIds: number[],
  targetOrgId: number,
): Promise<DocumentPreloader> {
  const preloader: DocumentPreloader = {
    clonedDocumentIds: new Map(),
    errors: [],
    preloadedDocuments: new Map(),
  }

  if (documentIds.length === 0) {
    return preloader
  }

  req.payload.logger.info({
    documentCount: documentIds.length,
    documentIds,
    msg: 'Phase 1: copying the documents before the transaction opens',
    targetOrgId,
  })

  const uniqueDocumentIds = Array.from(new Set(documentIds))

  for (let i = 0; i < uniqueDocumentIds.length; i += BATCH_SIZE) {
    const batch = uniqueDocumentIds.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map((documentId) => copySingleDocument(req, documentId, targetOrgId, preloader)),
    )
  }

  req.payload.logger.info({
    clonedCount: preloader.clonedDocumentIds.size,
    errorCount: preloader.errors.length,
    msg: 'Phase 1: document copies completed',
  })

  return preloader
}

/**
 * Copies one document and records the outcome on the preloader. It never throws, so one failed
 * document leaves the rest of its batch untouched.
 */
async function copySingleDocument(
  req: PayloadRequest,
  documentId: number,
  targetOrgId: number,
  preloader: DocumentPreloader,
): Promise<void> {
  let documentName: string | undefined
  let fileName: string | undefined

  try {
    const sourceDocument = await req.payload.findByID({
      collection: 'documents',
      depth: 0,
      id: documentId,
      req,
    })

    if (!sourceDocument) {
      throw new Error(`Source document with ID ${documentId} not found`)
    }

    documentName = sourceDocument.name ?? undefined
    fileName = sourceDocument.filename ?? undefined

    if (!sourceDocument.filename || !sourceDocument.mimeType || !sourceDocument.filesize) {
      throw new Error('Missing required file data')
    }

    const preloadedDocument: PreloadedDocument = {
      description: sourceDocument.description || undefined,
      filename: sourceDocument.filename,
      filesize: sourceDocument.filesize,
      id: sourceDocument.id,
      mimeType: sourceDocument.mimeType,
    }

    preloader.preloadedDocuments.set(documentId, preloadedDocument)

    // The bytes live in this scope only. The copy exists after the create, and a batch of large
    // files would otherwise stay on the heap until the response.
    const fileBuffer = await readDocumentFile(sourceDocument)

    const clonedId = await createClonedDocument(req, preloadedDocument, fileBuffer, targetOrgId)
    preloader.clonedDocumentIds.set(documentId, clonedId)
  } catch (error) {
    const errorMessage = getErrorMessage(error)

    preloader.errors.push({ documentId, documentName, error: errorMessage, fileName })

    req.payload.logger.warn({
      documentId,
      error: errorMessage,
      msg: 'Failed to copy a document in phase 1, the clone continues without it',
    })
  }
}

/** Creates the copy from the downloaded bytes. The request carries no transaction id. */
async function createClonedDocument(
  req: PayloadRequest,
  preloadedDocument: PreloadedDocument,
  fileBuffer: Buffer,
  targetOrgId: number,
): Promise<number> {
  const filename = `${Date.now()}-${preloadedDocument.filename}`

  const clonedDocument = await req.payload.create({
    collection: 'documents',
    data: {
      description: preloadedDocument.description,
      organisation: targetOrgId,
    },
    file: {
      data: fileBuffer,
      mimetype: preloadedDocument.mimeType,
      name: filename,
      size: preloadedDocument.filesize,
    },
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
    msg: 'Document copied in phase 1',
    newId: clonedDocument.id,
    originalId: preloadedDocument.id,
  })

  return clonedDocument.id
}
