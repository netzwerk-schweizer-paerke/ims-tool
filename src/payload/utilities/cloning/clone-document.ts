import { CollectionSlug, File, PayloadRequest } from 'payload'
import fetch from 'node-fetch'
import { getErrorMessage } from './error-utils'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'
import { assert } from 'es-toolkit'

export const cloneDocumentFile = async (
  req: PayloadRequest,
  documentId: number | string,
  targetOrgId: number,
): Promise<{ id: number; collection: CollectionSlug }> => {
  try {
    if (!documentId) {
      throw new Error('No document ID provided for cloning')
    }

    req.payload.logger.debug({
      msg: 'Cloning document',
      documentId,
      targetOrgId,
    })

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

    const serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const downloadUrl = `${serverUrl}${url}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    assert(process.env.PAYLOAD_API_KEY, 'PAYLOAD_API_KEY not set')

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

    const filename = `${Date.now()}-${sourceDocument.filename}`
    const file: File = {
      data: fileBuffer,
      name: filename,
      mimetype: sourceDocument.mimeType,
      size: sourceDocument.filesize,
    }

    const originalSelectedOrg = req.user?.selectedOrganisation

    try {
      const clonedDocument = await req.payload.create({
        collection: 'documents',
        data: {
          description: sourceDocument.description,
          organisation: targetOrgId,
        },
        file,
        req: mergeReqContextTargetOrgId(req, targetOrgId),
      })

      req.payload.logger.debug({
        msg: 'Document cloned successfully',
        originalId: documentId,
        newId: clonedDocument.id,
      })

      return {
        id: clonedDocument.id,
        collection: 'documents',
      }
    } finally {
      if (req.user && originalSelectedOrg !== undefined) {
        req.user.selectedOrganisation = originalSelectedOrg
      }
    }
  } catch (error) {
    req.payload.logger.error({
      msg: 'Error cloning document',
      documentId,
      error: getErrorMessage(error),
    })
    throw error
  }
}
