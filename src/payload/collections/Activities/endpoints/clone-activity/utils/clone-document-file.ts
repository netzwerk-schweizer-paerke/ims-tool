import { File, PayloadRequest } from 'payload'
import fetch from 'node-fetch'

/**
 * Extract safe error message from unknown error object
 */
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unknown error occurred'
}

/**
 * Clone a document from one organization to another
 * If the document is part of DocumentsPublic, it won't be cloned
 * For regular documents, we download and re-upload the file
 */
export const cloneDocumentFile = async (
  req: PayloadRequest,
  documentId: number | string,
  organisationId: number,
): Promise<{ id: number; collection: string }> => {
  try {
    // Skip if no document ID provided
    if (!documentId) {
      throw new Error('No document ID provided for cloning')
    }

    req.payload.logger.debug({
      msg: 'Cloning document',
      documentId,
      organisationId,
    })

    // Find the source document
    let sourceDocument
    try {
      sourceDocument = await req.payload.findByID({
        req,
        collection: 'documents',
        id: documentId,
        depth: 0,
      })
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error)
      req.payload.logger.error({
        msg: 'Failed to fetch source document',
        documentId,
        error: errorMessage,
      })
      throw new Error(`Failed to fetch source document with ID ${documentId}: ${errorMessage}`)
    }

    if (!sourceDocument) {
      const error = new Error(`Source document with ID ${documentId} not found`)
      req.payload.logger.error({
        msg: 'Document not found while cloning',
        documentId,
      })
      throw error
    }

    // Skip public documents as they're globally accessible
    if (sourceDocument.itemType === 'documentsPublic') {
      req.payload.logger.debug({
        msg: 'Skipping public document cloning',
        documentId,
      })
      return {
        id: sourceDocument.id,
        collection: 'documents',
      }
    }

    // Get the file data
    const { url } = sourceDocument
    if (!url) {
      const error = new Error(`Document with ID ${documentId} has no file`)
      req.payload.logger.error({
        msg: 'Document has no file',
        documentId,
      })
      throw error
    }

    // Construct the path for downloading the file
    const serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const downloadUrl = `${serverUrl}${url}`

    // Download the file with timeout
    let fileResponse
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      fileResponse = await fetch(downloadUrl, {
        headers: {
          'X-Payload-Request': 'true',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!fileResponse.ok) {
        throw new Error(`HTTP error: ${fileResponse.status} ${fileResponse.statusText}`)
      }
    } catch (fetchError: unknown) {
      const errorMessage = getErrorMessage(fetchError)
      const error = new Error(`Failed to download file: ${errorMessage}`)
      req.payload.logger.error({
        msg: 'Document download failed',
        url: downloadUrl,
        error: errorMessage,
      })
      throw error
    }

    // Get file buffer
    let fileBuffer
    try {
      fileBuffer = await fileResponse.arrayBuffer()
      fileBuffer = Buffer.from(fileBuffer)
    } catch (bufferError: unknown) {
      const errorMessage = getErrorMessage(bufferError)
      const error = new Error(`Failed to read file data: ${errorMessage}`)
      req.payload.logger.error({
        msg: 'Failed to read document file data',
        error: errorMessage,
      })
      throw error
    }

    // Now use Payload's create method with the file buffer
    let clonedDocument
    try {
      if (!fileBuffer) {
        throw new Error('No file buffer found')
      }
      if (!sourceDocument.filename) {
        throw new Error('No filename found')
      }
      if (!sourceDocument.mimeType) {
        throw new Error('No mime type found')
      }
      if (!sourceDocument.filesize) {
        throw new Error('No file size found')
      }

      const filename = `${Date.now()}-${sourceDocument.filename}`
      const file: File = {
        data: fileBuffer,
        name: filename,
        mimetype: sourceDocument.mimeType,
        size: sourceDocument.filesize,
      }

      // Set context on req object before calling create
      req.context = {
        ...req.context,
        targetOrganisationId: organisationId,
      }

      req.payload.logger.debug({
        msg: 'Setting target organization context',
        targetOrganisationId: organisationId,
      })

      // Temporarily change user's selected organization as a fallback
      const originalSelectedOrg = req.user?.selectedOrganisation
      if (req.user) {
        req.user.selectedOrganisation = { id: organisationId } as any
      }

      try {
        // Create new document with the file buffer
        clonedDocument = await req.payload.create({
          collection: 'documents',
          data: {
            description: sourceDocument.description,
            organisation: organisationId,
          },
          file,
          req, // Pass req with context already set
        })
      } finally {
        // Restore original selected organization
        if (req.user && originalSelectedOrg !== undefined) {
          req.user.selectedOrganisation = originalSelectedOrg
        }
      }

      req.payload.logger.debug({
        msg: 'Document created successfully',
        originalId: documentId,
        newId: clonedDocument.id,
      })
    } catch (createError: unknown) {
      const errorMessage = getErrorMessage(createError)
      req.payload.logger.error({
        msg: 'Document creation failed',
        sourceId: documentId,
        error: errorMessage,
      })
      throw new Error(`Failed to create cloned document: ${errorMessage}`)
    }

    // Return in the format expected for document references
    return {
      id: clonedDocument.id,
      collection: 'documents',
    }
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    req.payload.logger.error({
      msg: 'Error cloning document',
      documentId,
      error: errorMessage,
    })
    throw error
  }
}
