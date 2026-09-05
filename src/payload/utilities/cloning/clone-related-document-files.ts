import { isArray } from 'es-toolkit/compat'
import { randomUUID } from 'node:crypto'
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

/**
 * One `files` row of the clone, aligned by index with the source row it copies.
 *
 * The id is fixed before the first write, and every locale pass sends it. Payload then merges
 * the pass's locale into the row instead of replacing the row and the locales it carries. See
 * .claude/rules/project/decisions/clone-files-rows-keep-one-id-across-locales.md
 */
export interface ClonedFileRow {
  id: string
  /** True once a locale pass wrote the row. A pass must resend a written row, or it is dropped. */
  written: boolean
}

type CloneActivityDocumentsParams = {
  /** The rows the previous locale pass returned. The creating pass passes nothing. */
  clonedFileRows?: ClonedFileRow[]
  collectionName: 'activities' | 'task-flows' | 'task-lists'
  documentPreloader: DocumentPreloader
  locale: TypedLocale
  req: PayloadRequest
  /** The source read in `locale` with the fallback off, so each row holds that locale's document. */
  sourceEntity: Activity | TaskFlow | TaskList
  targetEntityId: number
  targetOrgId: number
  /** The statistics of the entity the endpoint started. Each attachment counts on it. */
  tracker: CloneStatisticsTracker
}

type FileRowData = { document?: number; id: string }

type SourceFileRow = NonNullable<(Activity | TaskFlow | TaskList)['files']>[number]

/**
 * Points the `files` rows of a cloned entity at the copies phase 1 made, for one locale.
 *
 * Every pass resends each written row with its id, so Payload keeps the row's other locales.
 * The only Payload operation here is the final update, so a document phase 1 could not copy is
 * recorded and skipped.
 */
export async function cloneRelatedDocumentFiles(
  params: CloneActivityDocumentsParams,
): Promise<ClonedFileRow[]> {
  const {
    clonedFileRows,
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
    return clonedFileRows ?? []
  }

  const filesData: FileRowData[] = []
  const nextRows: ClonedFileRow[] = []

  for (const [index, fileItem] of sourceEntity.files.entries()) {
    const row = clonedFileRows?.[index] ?? { id: randomUUID(), written: false }
    const clonedDocumentId = await resolveClonedFileDocument(
      fileItem.document,
      documentPreloader,
      req,
      tracker,
    )

    if (clonedDocumentId !== undefined) {
      filesData.push({ document: clonedDocumentId, id: row.id })
      nextRows.push({ id: row.id, written: true })
      continue
    }

    // The row has no document in this locale. A written row goes back without a document, and
    // Payload leaves its other locales as they are. Measured on payload@3.88.0.
    if (row.written) {
      filesData.push({ id: row.id })
    }

    nextRows.push(row)
  }

  // A later pass that resolved no document would resend the row set the previous pass wrote.
  // Payload writes nothing new for it, so the update is skipped.
  if (clonedFileRows && filesData.every((row) => row.document === undefined)) {
    return nextRows
  }

  // The create wrote the source rows first. An empty array must still replace them, or the clone
  // keeps document ids of the source organisation. The public share loader then reads them
  // across the tenant boundary.
  await req.payload.update({
    collection: collectionName,
    data: {
      files: filesData,
    },
    depth: 0,
    id: targetEntityId,
    locale,
    req: mergeReqContextTargetOrgId(req, targetOrgId),
  })

  req.payload.logger.debug({
    count: filesData.length,
    locale,
    msg: 'Updated the clone with the copied documents',
  })

  return nextRows
}

/**
 * Answers the id of the copy of one row's document, or undefined when the row has no document in
 * this locale or phase 1 could not copy it. The failure is recorded on the tracker.
 */
async function resolveClonedFileDocument(
  document: SourceFileRow['document'] | undefined,
  documentPreloader: DocumentPreloader,
  req: PayloadRequest,
  tracker: CloneStatisticsTracker,
): Promise<number | undefined> {
  if (document === null || document === undefined) {
    return undefined
  }

  const documentId = typeof document === 'object' ? document.id : document
  const documentName =
    typeof document === 'object' && document.name ? document.name : `Document ${documentId}`

  try {
    // The tracker counts each source document once per entity. A row this entity attaches
    // twice, or in two locales, still needs every attachment on the clone.
    return await tracker.resolveClonedDocumentId(documentId, async () =>
      resolvePreloadedDocumentId(documentPreloader, documentId),
    )
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

    return undefined
  }
}
