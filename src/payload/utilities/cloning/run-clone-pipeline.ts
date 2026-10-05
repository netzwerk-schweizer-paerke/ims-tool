import type { PayloadRequest, TypedLocale } from 'payload'

import type {
  CloneEndpointConfig,
  CloneEndpointResult,
} from '@/payload/utilities/cloning/create-clone-endpoint'

import { User } from '@/payload-types'
import {
  attachTaskToBlock,
  type BlockTarget,
  resolveBlockTarget,
  type ResolvedBlockTarget,
} from '@/payload/utilities/cloning/attach-task-to-block'
import {
  CloneHttpError,
  getErrorStatus,
  getValidationDetails,
} from '@/payload/utilities/cloning/clone-http-error'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import { deleteCreatedDocuments } from '@/payload/utilities/cloning/delete-created-documents'
import { DocumentPreloader, preloadDocuments } from '@/payload/utilities/cloning/document-preloader'
import { getErrorMessage } from '@/payload/utilities/cloning/error-utils'
import { linkDocumentsInPlace } from '@/payload/utilities/cloning/link-documents-in-place'
import { CloneRecordRef, remapTaskLinks } from '@/payload/utilities/cloning/remap-task-links'
import { validateCloneAccess } from '@/payload/utilities/cloning/validate-access'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

export type CloneMode = 'copy' | 'link'

export interface ClonePipelineArgs {
  /** Every locale the clone carries, default first. */
  cloneLocales: TypedLocale[]
  /** The request locale, already narrowed to a content locale. */
  locale: TypedLocale
  /**
   * `copy` creates new tasks and documents in the target park. `link` keeps the originals, and is
   * valid only when every source belongs to the target park (PIMS-83).
   */
  mode: CloneMode
  req: PayloadRequest
  /** Unique source ids. */
  sourceIds: number[]
  /**
   * A Prozessgruppe that links each copy (PIMS-83). Valid for task flows and task lists only.
   * Without it, a copy stands alone in the target park, as a list-view clone does.
   */
  target?: BlockTarget
  targetOrganisationId: number
  user: null | User
}

export interface ClonePipelineResult {
  body: CloneEndpointResult
  status: number
}

/**
 * Runs one clone batch: the access check, phase 1 outside the transaction, phase 2 inside one
 * transaction, the commit, and the cleanup on a failure. It answers the response body and status.
 *
 * See .claude/rules/project/decisions/clone-copies-documents-before-the-transaction.md
 */
export const runClonePipeline = async <TSource>(
  config: CloneEndpointConfig<TSource>,
  {
    cloneLocales,
    locale,
    mode,
    req,
    sourceIds,
    target,
    targetOrganisationId,
    user,
  }: ClonePipelineArgs,
): Promise<ClonePipelineResult> => {
  const { cloneSource, collectionSlug, collectNestedDocumentIds, label, readSource } = config
  let resolvedTarget: null | ResolvedBlockTarget = null

  // In link mode the preloader maps every document to itself. A cleanup over its values would
  // delete the originals, so only a copy run may delete what phase 1 created.
  const deletePhaseOneCopies = async (preloader: DocumentPreloader) => {
    if (mode === 'copy') {
      await deleteCreatedDocuments(req, preloader.clonedDocumentIds.values())
    }
  }

  // PHASE 1: Check access, read the sources, download the documents and create their copies.
  // This must stay OUTSIDE the transaction. One document create costs seconds, and would
  // otherwise hold the connection in the `idle in transaction` state.
  req.payload.logger.info({
    msg: `Phase 1: Pre-loading documents for all ${label.plural}`,
    sourceIds,
  })

  const allDocumentIds: number[] = []
  const entries: Array<{
    id: number
    name: string
    source: TSource
    sourceOrganisationId: null | number
  }> = []
  let documentPreloader: DocumentPreloader

  try {
    if (target) {
      if (collectionSlug === 'activities') {
        throw new CloneHttpError('An activity cannot be pasted into a Prozessgruppe', 400)
      }

      resolvedTarget = await resolveBlockTarget(req, target, targetOrganisationId)
    }

    for (const sourceId of sourceIds) {
      const accessValidation = await validateCloneAccess({
        collectionSlug,
        req,
        sourceId,
        targetOrgId: targetOrganisationId,
        user,
      })

      if (!accessValidation.isValid) {
        throw new CloneHttpError(
          `${label.singular} ${sourceId}: ${accessValidation.error?.message ?? 'access denied'}`,
          accessValidation.error?.status ?? 403,
        )
      }

      const { documentIds, name, source } = await readSource({
        cloneLocales,
        locale,
        req,
        sourceId,
      })

      // `validateCloneAccess` returns early for a super admin, so it cannot supply this id.
      const sourceRecord = await req.payload.findByID({
        collection: collectionSlug,
        depth: 0,
        id: sourceId,
        overrideAccess: true,
        req,
        select: { organisation: true },
      })

      const sourceOrganisationId = getIdFromRelation(sourceRecord.organisation)

      // A link across parks would point one park's record at another park's tasks.
      if (mode === 'link' && sourceOrganisationId !== targetOrganisationId) {
        throw new CloneHttpError(
          `${label.singular} ${sourceId}: a link is only possible inside one park`,
          400,
        )
      }

      allDocumentIds.push(...documentIds)
      entries.push({ id: sourceId, name, source, sourceOrganisationId })
    }

    if (collectNestedDocumentIds) {
      const sources = entries.map((entry) => entry.source)
      allDocumentIds.push(...(await collectNestedDocumentIds({ cloneLocales, req, sources })))
    }

    // Copy all unique documents into the target organisation
    const uniqueDocumentIds = Array.from(new Set(allDocumentIds))
    documentPreloader =
      mode === 'link'
        ? linkDocumentsInPlace(uniqueDocumentIds)
        : await preloadDocuments(req, uniqueDocumentIds, targetOrganisationId)

    req.payload.logger.info({
      clonedCount: documentPreloader.clonedDocumentIds.size,
      documentCount: uniqueDocumentIds.length,
      errorCount: documentPreloader.errors.length,
      msg: 'Phase 1 completed - documents copied',
    })
  } catch (error) {
    // No transaction is open yet, so there is nothing to roll back.
    const status = getErrorStatus(error)

    req.payload.logger.error({
      error: getErrorMessage(error),
      msg: 'Failed to read the sources before the clone',
      sourceIds,
      stack: error instanceof Error ? error.stack : undefined,
      status,
    })

    return { body: { error: `Failed to clone ${label.plural}: ${getErrorMessage(error)}` }, status }
  }

  let transactionID: number | string

  try {
    const started = await req.payload.db.beginTransaction()

    if (!started) {
      throw new Error('The database adapter did not start a transaction')
    }

    transactionID = started
  } catch (error) {
    // The adapter throws when no connection is free. Phase 1 committed each copy on its own
    // connection, so a failed begin leaves them behind as well.
    await deletePhaseOneCopies(documentPreloader)

    req.payload.logger.error({
      error: getErrorMessage(error),
      msg: 'Failed to start database transaction',
      sourceIds,
    })

    return {
      body: { error: `Failed to clone ${label.plural}: ${getErrorMessage(error)}` },
      status: 500,
    }
  }

  const tracker = CloneStatisticsTracker.getInstance(transactionID)

  if (mode === 'link') {
    tracker.linkTasksInPlace()
  }

  try {
    // PHASE 2: Clone the sources with the copied documents (INSIDE the transaction)
    req.payload.logger.info({
      locale,
      msg: `Phase 2: Cloning ${label.plural} with pre-loaded documents`,
      sourceIds,
      targetOrgId: targetOrganisationId,
      transactionID,
    })

    const transactionalReq: PayloadRequest = {
      ...req,
      transactionID,
    }

    const clonedEntries: Array<{ entityId: number; record: CloneRecordRef }> = []

    // Process each source within the SAME transaction
    for (const { id: sourceId, name, source, sourceOrganisationId } of entries) {
      tracker.startEntity(sourceId)
      tracker.setSourceInfo(sourceId, name, collectionSlug)

      const cloned = await cloneSource({
        cloneLocales,
        documentPreloader,
        req: transactionalReq,
        source,
        sourceId,
        targetOrgId: targetOrganisationId,
        tracker,
      })

      tracker.setCloneInfo(cloned.id, cloned.name, collectionSlug)

      // The statistics count this field (PIMS-93). A database write sets one column and runs
      // no collection hook, so the clone keeps its `updatedBy` and its locales.
      if (sourceOrganisationId !== null) {
        await req.payload.db.updateOne({
          collection: collectionSlug,
          data: { clonedFromOrganisation: sourceOrganisationId },
          id: cloned.id,
          req: transactionalReq,
          returning: false,
        })
      }

      if (resolvedTarget && collectionSlug !== 'activities') {
        const written = await attachTaskToBlock({
          cloneLocales,
          req: transactionalReq,
          target: resolvedTarget,
          task: { id: cloned.id, relationTo: collectionSlug },
        })

        // A copy nobody links is invisible in the landscape, so a failed attach fails the paste.
        if (written === 0) {
          throw new CloneHttpError('The target Prozessgruppe exists in no locale', 400)
        }
      }

      req.payload.logger.info({
        clonedId: cloned.id,
        msg: 'Cloned successfully',
        sourceId,
      })

      clonedEntries.push({
        entityId: sourceId,
        record: { collection: collectionSlug, id: cloned.id },
      })

      tracker.endEntity()
    }

    // A rich text link cannot resolve while the clone runs, because two task flows often link
    // each other. Patch every link once the batch holds every clone.
    //
    // `rootClones` answers a link that names another source of the same batch. Only a task
    // endpoint matches it, because no task link ever names an activity.
    const rootClones = new Map(
      clonedEntries.map(({ entityId, record }) => [`${collectionSlug}:${entityId}`, record.id]),
    )

    for (const { entityId, record } of clonedEntries) {
      // The strip pass saw every rich text this clone wrote. No task link means no work.
      if (!tracker.hasTaskLinks(entityId)) {
        continue
      }

      const linkTotals = await remapTaskLinks({
        cloneLocales,
        lookupClonedTask: (collection, taskSourceId) =>
          tracker.getClonedTaskId(entityId, collection, taskSourceId) ??
          rootClones.get(`${collection}:${taskSourceId}`),
        records: [record, ...tracker.getClonedTaskRecords(entityId)],
        req: transactionalReq,
        targetOrgId: targetOrganisationId,
      })

      // Each counter counts one task, however many links name it.
      req.payload.logger.info({
        degradedTasks: linkTotals.degraded,
        keptTasks: linkTotals.kept,
        msg: 'Resolved the rich text links to nested tasks',
        remappedTasks: linkTotals.remapped,
        sourceId: entityId,
      })

      if (linkTotals.dropped.length > 0) {
        // A dropped link is a content loss. Report it, or the caller reads an incomplete
        // copy as a complete one.
        const names = linkTotals.dropped.map((task) => task.name.trim()).join(', ')

        tracker.startEntity(entityId)
        tracker.addError({
          errorMessage: `Links to ${linkTotals.dropped.length} record(s) outside the target organisation became plain text: ${names}`,
          op: 'remapTaskLinks',
        })
        tracker.endEntity()
      }
    }

    // Commit the SINGLE transaction after ALL sources are processed
    await req.payload.db.commitTransaction(transactionID)

    req.payload.logger.info({
      msg: `All ${label.plural} cloned successfully`,
      transactionID,
    })

    const results = tracker.finalize()

    return { body: { message: 'Executed successfully', results }, status: 200 }
  } catch (error) {
    await req.payload.db.rollbackTransaction(transactionID)

    // Phase 1 committed each copy on its own connection, so the rollback leaves them behind.
    await deletePhaseOneCopies(documentPreloader)

    const status = getErrorStatus(error)
    const details = getValidationDetails(error)

    req.payload.logger.error({
      details,
      error: getErrorMessage(error),
      msg: `Failed to clone ${label.plural} - transaction rolled back`,
      sourceIds,
      stack: error instanceof Error ? error.stack : undefined,
      status,
      targetOrgId: targetOrganisationId,
      transactionID,
    })

    return {
      body: { details, error: `Failed to clone ${label.plural}: ${getErrorMessage(error)}` },
      status,
    }
  } finally {
    // The tracker lives in a static map keyed by transaction id. Only this call frees it.
    CloneStatisticsTracker.disposeInstance(transactionID)
  }
}
