import { PayloadRequest } from 'payload'
import { isArray } from 'es-toolkit/compat'
import { Activity, TaskFlow, TaskList } from '@/payload-types'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import { cloneDocumentFile } from '@/payload/utilities/cloning/clone-document'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

type CloneActivityDocumentsParams = {
  req: PayloadRequest
  sourceEntity: Activity | TaskFlow | TaskList
  collectionName: 'activities' | 'task-flows' | 'task-lists'
  targetEntityId: number
  targetOrgId: number
  locale: string
  documentPreloader?: DocumentPreloader
}

export async function cloneRelatedDocumentFiles(
  params: CloneActivityDocumentsParams,
): Promise<void> {
  const {
    req,
    sourceEntity,
    targetEntityId,
    targetOrgId,
    collectionName,
    locale,
    documentPreloader,
  } = params

  const tracker = CloneStatisticsTracker.getInstance(req.transactionID)

  if (!sourceEntity.files || !isArray(sourceEntity.files)) {
    return
  }

  const clonedFiles: any[] = []

  for (const fileItem of sourceEntity.files) {
    if (fileItem.document === null || fileItem.document === undefined) {
      continue
    }

    tracker.addSourceDocument()

    const documentId =
      typeof fileItem.document === 'object' ? fileItem.document.id : fileItem.document
    const documentName =
      typeof fileItem.document === 'object' && fileItem.document.name
        ? fileItem.document.name
        : `Document ${documentId}`

    try {
      let clonedDoc: { id: number; collection: string }

      const existingClonedId = tracker.getClonedDocumentId(documentId)

      if (existingClonedId) {
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
        // Use pre-loaded document if available
        if (documentPreloader && documentPreloader.preloadedDocuments.has(documentId)) {
          const preloadedDoc = documentPreloader.preloadedDocuments.get(documentId)!
          const { createClonedDocumentFromPreloaded } = await import(
            '@/payload/utilities/cloning/document-preloader'
          )
          clonedDoc = await createClonedDocumentFromPreloaded(req, preloadedDoc, targetOrgId)
        } else {
          // Fallback to original method (will cause transaction timeout risk)
          clonedDoc = await cloneDocumentFile(req, documentId, targetOrgId)
        }

        if (clonedDoc) {
          tracker.setDocumentCloneMapping(documentId, clonedDoc.id)
          tracker.addClonedDocument()

          clonedFiles.push({ document: clonedDoc.id })
          req.payload.logger.debug({
            msg: 'Document cloned and cached for direct attachment',
            sourceId: documentId,
            clonedId: clonedDoc.id,
          })
        }
      }
    } catch (error) {
      req.payload.logger.warn({
        msg: 'Failed to clone document, continuing with others',
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      try {
        const sourceDoc = await req.payload.findByID({
          req,
          collection: 'documents',
          id: documentId,
          depth: 1,
          locale: locale as any,
        })

        const fileName = sourceDoc.filename || 'Unknown'

        let usageInfo = 'Direct file attachment'
        if (sourceDoc.usedIn) {
          if (typeof sourceDoc.usedIn === 'string') {
            usageInfo = sourceDoc.usedIn
          } else if (typeof sourceDoc.usedIn === 'object') {
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

  if (clonedFiles.length > 0) {
    await req.payload.update({
      req: mergeReqContextTargetOrgId(req, targetOrgId),
      collection: collectionName,
      locale: locale as any,
      id: targetEntityId,
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
