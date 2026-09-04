import { isArray } from 'es-toolkit/compat'
import { PayloadRequest, TypedLocale } from 'payload'

import { Activity, TaskFlow, TaskList } from '@/payload-types'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import {
  describePreloadFailure,
  DocumentPreloader,
  resolvePreloadedDocumentId,
} from '@/payload/utilities/cloning/document-preloader'
import { getErrorMessage } from '@/payload/utilities/cloning/error-utils'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'

type CloneActivityDocumentsParams = {
  collectionName: 'activities' | 'task-flows' | 'task-lists'
  documentPreloader: DocumentPreloader
  locale: TypedLocale
  req: PayloadRequest
  sourceEntity: Activity | TaskFlow | TaskList
  targetEntityId: number
  targetOrgId: number
  /** The statistics of the entity the endpoint started. Each attachment counts on it. */
  tracker: CloneStatisticsTracker
}

/**
 * Points the `files` rows of a cloned entity at the copies phase 1 made.
 *
 * This runs inside the transaction. The only Payload operation here is the final update, so a
 * document phase 1 could not copy is recorded and skipped, and the clone continues without it.
 */
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
    tracker,
  } = params

  if (!sourceEntity.files || !isArray(sourceEntity.files)) {
    return
  }

  const clonedFiles: { document: number }[] = []

  for (const fileItem of sourceEntity.files) {
    if (fileItem.document === null || fileItem.document === undefined) {
      continue
    }

    const documentId =
      typeof fileItem.document === 'object' ? fileItem.document.id : fileItem.document
    const documentName =
      typeof fileItem.document === 'object' && fileItem.document.name
        ? fileItem.document.name
        : `Document ${documentId}`

    try {
      // The tracker counts each source document once per entity. A row this entity attaches
      // twice still needs both attachments on the clone.
      const clonedDocumentId = await tracker.resolveClonedDocumentId(documentId, async () =>
        resolvePreloadedDocumentId(documentPreloader, documentId),
      )

      clonedFiles.push({ document: clonedDocumentId })
    } catch (error) {
      // The lookup ran no Payload operation, so the transaction is intact. A read of the source
      // document for the report would run inside it, and a NotFound there would kill it.
      const failure = describePreloadFailure(documentPreloader, documentId)

      req.payload.logger.warn({
        documentId,
        error: getErrorMessage(error),
        msg: 'Document was not copied in phase 1, the clone continues without it',
      })

      tracker.addMissingFileError({
        documentId,
        documentName: failure.documentName ?? documentName,
        error: getErrorMessage(error),
        fileName: failure.fileName ?? 'Unknown',
        usageLocation: 'Direct file attachment',
      })
    }
  }

  // The create wrote the source rows first. An empty array must still replace them, or the clone
  // keeps document ids of the source organisation, which the public share loader then reads
  // across the tenant boundary.
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
    msg: 'Updated the clone with the copied documents',
  })
}
