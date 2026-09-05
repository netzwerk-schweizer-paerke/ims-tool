import { Endpoint, PayloadRequest, TypedLocale } from 'payload'
import { z } from 'zod'

import { toContentLocale } from '@/lib/locale-utils'
import {
  CloneHttpError,
  getErrorStatus,
  getValidationDetails,
} from '@/payload/utilities/cloning/clone-http-error'
import { getCloneLocales } from '@/payload/utilities/cloning/clone-locales'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import { deleteCreatedDocuments } from '@/payload/utilities/cloning/delete-created-documents'
import { DocumentPreloader, preloadDocuments } from '@/payload/utilities/cloning/document-preloader'
import { getErrorMessage } from '@/payload/utilities/cloning/error-utils'
import { CloneRecordRef, remapTaskLinks } from '@/payload/utilities/cloning/remap-task-links'
import { GenericCloneStatisticsFinalized } from '@/payload/utilities/cloning/types'
import { validateCloneAccess } from '@/payload/utilities/cloning/validate-access'
import { formatValidationErrors } from '@/payload/utilities/cloning/validation-schemas'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'

const batchCloneBodySchema = z.object({
  ids: z.array(z.number().min(1)).min(1, 'At least one ID is required'),
  locale: z.string(),
  targetOrganisationId: z.number(),
})

export type CloneableCollectionSlug = 'activities' | 'task-flows' | 'task-lists'

export type CloneEndpointBody = z.infer<typeof batchCloneBodySchema>

/**
 * What one cloneable collection contributes to `POST /api/<collection>/clone`.
 *
 * The handler owns the body, the access check, the two phases, the transaction and the cleanup.
 * A collection supplies only the reads of phase 1 and the write of phase 2.
 */
export interface CloneEndpointConfig<TSource> {
  /** Copies one source inside the transaction. `req` carries the transaction id. */
  cloneSource: (args: CloneSourceArgs<TSource>) => Promise<{ id: number; name: string }>
  collectionSlug: CloneableCollectionSlug
  /**
   * Runs once in phase 1, after every source is read. It answers the document ids that only a
   * nested record links, so that phase 2 finds their copies as well.
   */
  collectNestedDocumentIds?: (args: {
    cloneLocales: TypedLocale[]
    req: PayloadRequest
    sources: TSource[]
  }) => Promise<number[]>
  /** The resource in the messages: `Task flow 7: access denied`, `Failed to clone task flows`. */
  label: { plural: string; singular: string }
  /** Reads one source in phase 1, with no transaction open. The access check already passed. */
  readSource: (args: ReadCloneSourceArgs) => Promise<ReadCloneSourceResult<TSource>>
}

export type CloneEndpointResult =
  | ReturnType<typeof formatValidationErrors>
  | { details?: string[]; error: string }
  | { message: string; results: GenericCloneStatisticsFinalized }

export interface CloneSourceArgs<TSource> {
  /** Every locale the clone carries, default first. */
  cloneLocales: TypedLocale[]
  /** The copies phase 1 made, keyed by source document id. */
  documentPreloader: DocumentPreloader
  req: PayloadRequest
  /** What `readSource` retained for this source. */
  source: TSource
  sourceId: number
  targetOrgId: number
  /** The statistics of this source. `startEntity` already ran, so every counter lands on it. */
  tracker: CloneStatisticsTracker
}

export interface ReadCloneSourceArgs {
  /** Every locale the clone carries, default first. */
  cloneLocales: TypedLocale[]
  /** The request locale. It labels the report. */
  locale: TypedLocale
  req: PayloadRequest
  sourceId: number
}

export interface ReadCloneSourceResult<TSource> {
  /** Every document id the source links, in every locale. A duplicate is fine. */
  documentIds: number[]
  /** The label of the source in the report. */
  name: string
  /** What phase 2 needs from the reads. A collection that reads again in phase 2 keeps nothing. */
  source: TSource
}

/**
 * Builds the batch clone endpoint of one collection.
 *
 * Phase 1 checks the access, reads the sources and creates the document copies, with no
 * transaction open. Phase 2 opens one transaction, writes every clone into it and commits once.
 * A failed begin or a rollback deletes the phase 1 copies, and the response carries the status
 * of the error that caused it. See
 * .claude/rules/project/decisions/clone-copies-documents-before-the-transaction.md
 */
export const createCloneEndpoint = <TSource>(config: CloneEndpointConfig<TSource>): Endpoint => ({
  handler: async (req) => {
    const { cloneSource, collectionSlug, collectNestedDocumentIds, label, readSource } = config

    requireAuthentication(req)
    const user = req.user

    let validatedBody: CloneEndpointBody

    try {
      const rawBody = req.json ? await req.json() : {}
      const bodyResult = batchCloneBodySchema.safeParse(rawBody)

      if (!bodyResult.success) {
        req.payload.logger.warn({
          errors: formatValidationErrors(bodyResult.error),
          msg: 'Invalid batch clone request body',
          rawBody,
        })
        return Response.json(formatValidationErrors(bodyResult.error), { status: 400 })
      }
      validatedBody = bodyResult.data
    } catch (error) {
      req.payload.logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        msg: 'Error parsing batch clone request body',
      })
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { ids: sourceIds, locale: requestedLocale, targetOrganisationId } = validatedBody

    // Narrow the request locale to a configured content locale before any write starts.
    const locale = toContentLocale(requestedLocale, req.payload.config)

    if (!locale) {
      req.payload.logger.warn({
        msg: 'Unsupported locale in batch clone request',
        requestedLocale,
      })
      return Response.json({ error: 'Unsupported locale' }, { status: 400 })
    }

    // The clone carries every configured locale the source really has, not the request locale
    // alone. The request locale still labels the report and drives the access check.
    const cloneLocales = getCloneLocales(req.payload.config)

    // PHASE 1: Check access, read the sources, download the documents and create their copies.
    // This must stay OUTSIDE the transaction. One document create costs seconds, and would
    // otherwise hold the connection in the `idle in transaction` state.
    req.payload.logger.info({
      msg: `Phase 1: Pre-loading documents for all ${label.plural}`,
      sourceIds,
    })

    const allDocumentIds: number[] = []
    const entries: Array<{ id: number; name: string; source: TSource }> = []
    let documentPreloader: DocumentPreloader

    try {
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

        allDocumentIds.push(...documentIds)
        entries.push({ id: sourceId, name, source })
      }

      if (collectNestedDocumentIds) {
        const sources = entries.map((entry) => entry.source)
        allDocumentIds.push(...(await collectNestedDocumentIds({ cloneLocales, req, sources })))
      }

      // Copy all unique documents into the target organisation
      const uniqueDocumentIds = Array.from(new Set(allDocumentIds))
      documentPreloader = await preloadDocuments(req, uniqueDocumentIds, targetOrganisationId)

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

      return Response.json(
        { error: `Failed to clone ${label.plural}: ${getErrorMessage(error)}` },
        { status },
      )
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
      await deleteCreatedDocuments(req, documentPreloader.clonedDocumentIds.values())

      req.payload.logger.error({
        error: getErrorMessage(error),
        msg: 'Failed to start database transaction',
        sourceIds,
      })

      return Response.json(
        { error: `Failed to clone ${label.plural}: ${getErrorMessage(error)}` },
        { status: 500 },
      )
    }

    const tracker = CloneStatisticsTracker.getInstance(transactionID)

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
      for (const { id: sourceId, name, source } of entries) {
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
      const rootClones = new Map(
        clonedEntries.map(({ entityId, record }) => [`${collectionSlug}:${entityId}`, record.id]),
      )

      for (const { entityId, record } of clonedEntries) {
        const linkTotals = await remapTaskLinks({
          cloneLocales,
          lookupClonedTask: (collection, taskSourceId) =>
            tracker.getClonedTaskId(entityId, collection, taskSourceId) ??
            rootClones.get(`${collection}:${taskSourceId}`),
          records: [record, ...tracker.getClonedTaskRecords(entityId)],
          req: transactionalReq,
          targetOrgId: targetOrganisationId,
        })

        if (linkTotals.degraded > 0 || linkTotals.remapped > 0) {
          req.payload.logger.info({
            degradedLinks: linkTotals.degraded,
            msg: 'Resolved the rich text links to nested tasks',
            remappedLinks: linkTotals.remapped,
            sourceId: entityId,
          })
        }
      }

      // Commit the SINGLE transaction after ALL sources are processed
      await req.payload.db.commitTransaction(transactionID)

      req.payload.logger.info({
        msg: `All ${label.plural} cloned successfully`,
        transactionID,
      })

      const results = tracker.finalize()

      return Response.json(
        {
          message: 'Executed successfully',
          results,
        },
        { status: 200 },
      )
    } catch (error) {
      await req.payload.db.rollbackTransaction(transactionID)

      // Phase 1 committed each copy on its own connection, so the rollback leaves them behind.
      await deleteCreatedDocuments(req, documentPreloader.clonedDocumentIds.values())

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

      return Response.json(
        {
          details,
          error: `Failed to clone ${label.plural}: ${getErrorMessage(error)}`,
        },
        { status },
      )
    } finally {
      // The tracker lives in a static map keyed by transaction id. Only this call frees it.
      CloneStatisticsTracker.disposeInstance(transactionID)
    }
  },
  method: 'post',
  path: '/clone',
})
