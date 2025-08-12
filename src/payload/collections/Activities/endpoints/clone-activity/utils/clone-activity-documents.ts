import { PayloadRequest } from 'payload'
import { isArray } from 'lodash-es'
import { Activity, Document } from '@/payload-types'
import { CloneStatisticsTracker } from './clone-statistics-tracker'
import { cloneDocumentFile } from './clone-document-file'

type CloneActivityDocumentsParams = {
  req: PayloadRequest
  sourceActivity: Activity
  clonedActivityId: number
  targetOrgId: number
  tracker: CloneStatisticsTracker
  locale?: string
}

/**
 * Clones all documents associated with an activity
 * Handles document deduplication and error tracking
 * Updates the cloned activity with the new document references
 */
export async function cloneActivityDocuments(params: CloneActivityDocumentsParams): Promise<void> {
  const { req, sourceActivity, clonedActivityId, targetOrgId, tracker, locale } = params

  if (!sourceActivity.files || !isArray(sourceActivity.files)) {
    return
  }

  const clonedFiles = []

  for (const fileItem of sourceActivity.files) {
    // Skip null documents - these are empty file slots
    if (fileItem.document === null || fileItem.document === undefined) {
      continue
    }

    const documentId =
      typeof fileItem.document === 'object' ? fileItem.document.id : fileItem.document
    const documentName =
      typeof fileItem.document === 'object' && fileItem.document.name
        ? fileItem.document.name
        : `Document ${documentId}`

    // Track this document in source
    tracker.addSourceDocument(documentId)

    try {
      let clonedDoc: { id: number; collection: string }

      // Check if we've already cloned this document
      const existingClonedId = tracker.getClonedDocumentId(documentId)
      if (existingClonedId) {
        // Reuse the existing cloned document
        clonedDoc = {
          id: existingClonedId,
          collection: 'documents',
        }
        req.payload.logger.debug({
          msg: 'Reusing existing cloned document for direct attachment',
          sourceId: documentId,
          clonedId: existingClonedId,
        })
      } else {
        // Try to clone the document
        clonedDoc = await cloneDocumentFile(req, documentId, targetOrgId)

        if (clonedDoc) {
          // Store the mapping for future reuse
          tracker.setDocumentCloneMapping(documentId, clonedDoc.id)
          req.payload.logger.debug({
            msg: 'Document cloned and cached for direct attachment',
            sourceId: documentId,
            clonedId: clonedDoc.id,
          })
        }
      }

      if (clonedDoc) {
        clonedFiles.push({
          document: clonedDoc.id,
        })
        tracker.setClonedStats({
          documentsCloned: (tracker.getStatistics().cloned.documentsCloned || 0) + 1,
        })
        // Track successfully cloned document
        tracker.addClonedDocument(documentId)
      }
    } catch (error) {
      // Capture the error but continue with other documents
      req.payload.logger.warn({
        msg: 'Failed to clone document, continuing with others',
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      // Get document details for error reporting
      try {
        const sourceDoc = (await req.payload.findByID({
          req,
          collection: 'documents',
          id: documentId,
          depth: 1,
          locale: locale as any,
        })) as Document

        const fileName = sourceDoc.filename || 'Unknown'

        // Get the document's actual usedIn field
        let usageInfo = 'Direct file attachment'
        if (sourceDoc.usedIn) {
          // The usedIn field can be various types, let's format it properly
          if (typeof sourceDoc.usedIn === 'string') {
            usageInfo = sourceDoc.usedIn
          } else if (typeof sourceDoc.usedIn === 'object') {
            // If it's an object or array, try to extract meaningful information
            usageInfo = JSON.stringify(sourceDoc.usedIn, null, 2)
          }
        }

        tracker.addMissingFileError({
          documentId,
          documentName: sourceDoc?.name || documentName,
          fileName,
          error: error instanceof Error ? error.message : 'Unknown error',
          usageLocation: usageInfo,
        })
      } catch {
        // If we can't even get the document details, record what we know
        tracker.addMissingFileError({
          documentId,
          documentName: documentName,
          fileName: 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
          usageLocation: 'Direct file attachment',
        })
      }
    }
  }

  // Update activity with cloned documents
  if (clonedFiles.length > 0) {
    await req.payload.update({
      req: {
        ...req,
        context: {
          ...req.context,
          targetOrganisationId: targetOrgId,
        },
      },
      collection: 'activities',
      id: clonedActivityId,
      data: {
        files: clonedFiles,
      },
    })

    req.payload.logger.debug({
      msg: 'Updated activity with cloned documents',
      count: clonedFiles.length,
    })
  }
}
