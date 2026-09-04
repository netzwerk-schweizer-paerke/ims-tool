import { isArray } from 'es-toolkit/compat'
import { PayloadRequest, TypedLocale } from 'payload'

import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { Activity, TaskFlow, TaskList } from '@/payload-types'
import { cloneDocumentFile } from '@/payload/utilities/cloning/clone-document'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'

type CloneActivityDocumentsParams = {
  collectionName: 'activities' | 'task-flows' | 'task-lists'
  documentPreloader?: DocumentPreloader
  locale: TypedLocale
  req: PayloadRequest
  sourceEntity: Activity | TaskFlow | TaskList
  targetEntityId: number
  targetOrgId: number
}

export async function cloneRelatedDocumentFiles(
  params: CloneActivityDocumentsParams,
): Promise<void> {
  const {
    collectionName,
    documentPreloader,
    locale,
    req,
    sourceEntity,
    targetEntityId,
    targetOrgId,
  } = params

  const tracker = CloneStatisticsTracker.getInstance(req.transactionID)

  if (!sourceEntity.files || !isArray(sourceEntity.files)) {
    return
  }

  const clonedFiles: { document: number }[] = []

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
      let clonedDoc: { collection: string; id: number; }

      const existingClonedId = tracker.getClonedDocumentId(documentId)

      if (existingClonedId) {
        clonedDoc = {
          collection: 'documents',
          id: existingClonedId,
        }
        req.payload.logger.debug({
          clonedId: existingClonedId,
          msg: 'Reusing existing cloned document for direct attachment',
          sourceId: documentId,
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

        tracker.setDocumentCloneMapping(documentId, clonedDoc.id)
        req.payload.logger.debug({
          clonedId: clonedDoc.id,
          msg: 'Document cloned and cached for direct attachment',
          sourceId: documentId,
        })
      }

      // A row this entity attaches twice counts once against the source and once against the
      // clone. Both branches must record it, or the clone loses the second attachment and the
      // completeness figure reports a file that did reach the target as missing.
      tracker.addClonedDocument()
      clonedFiles.push({ document: clonedDoc.id })
    } catch (error) {
      req.payload.logger.warn({
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        msg: 'Failed to clone document, continuing with others',
      })

      try {
        const sourceDoc = await req.payload.findByID({
          collection: 'documents',
          depth: 1,
          id: documentId,
          locale,
          req,
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
          error: error instanceof Error ? error.message : 'Unknown error',
          fileName,
          usageLocation: usageInfo,
        })
      } catch {
        tracker.addMissingFileError({
          documentId,
          documentName: documentName,
          error: error instanceof Error ? error.message : 'Unknown error',
          fileName: 'Unknown',
          usageLocation: 'Direct file attachment',
        })
      }
    }
  }

  if (clonedFiles.length > 0) {
    await req.payload.update({
      collection: collectionName,
      data: {
        files: clonedFiles,
      },
      id: targetEntityId,
      locale,
      req: mergeReqContextTargetOrgId(req, targetOrgId),
    })

    req.payload.logger.debug({
      count: clonedFiles.length,
      msg: 'Updated activity with cloned documents',
    })
  }
}
