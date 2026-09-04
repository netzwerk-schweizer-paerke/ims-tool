import { Endpoint, PayloadRequest } from 'payload'
import { z } from 'zod'

import { getLocalizedValue, toContentLocale } from '@/lib/locale-utils'
import { createTaskList } from '@/payload/collections/Activities/endpoints/clone/utils/clone-task-flow-or-list'
import { CloneHttpError, getErrorStatus } from '@/payload/utilities/cloning/clone-http-error'
import { getCloneLocales } from '@/payload/utilities/cloning/clone-locales'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import { deleteCreatedDocuments } from '@/payload/utilities/cloning/delete-created-documents'
import { DocumentPreloader, preloadDocuments } from '@/payload/utilities/cloning/document-preloader'
import { scanTaskListForDocumentIds } from '@/payload/utilities/cloning/document-scanner'
import { getErrorMessage } from '@/payload/utilities/cloning/error-utils'
import { GenericCloneStatisticsFinalized } from '@/payload/utilities/cloning/types'
import { validateCloneAccess } from '@/payload/utilities/cloning/validate-access'
import { formatValidationErrors } from '@/payload/utilities/cloning/validation-schemas'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'

const batchCloneBodySchema = z.object({
  ids: z.array(z.number().min(1)).min(1, 'At least one ID is required'),
  locale: z.string(),
  targetOrganisationId: z.number(),
})

export type TaskListCloneEndpointBodySchema = z.infer<typeof batchCloneBodySchema>

export type TaskListCloneEndpointResult =
  ReturnType<typeof formatValidationErrors> | { error: string } | {
      message: string
      results: GenericCloneStatisticsFinalized
    }

export const cloneTaskListTransactional: Endpoint = {
  handler: async (req) => {
    // Step 1: Verify authentication
    requireAuthentication(req)
    const user = req.user

    // Step 2: Validate and parse request body for task list IDs
    let validatedBody: TaskListCloneEndpointBodySchema

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

    const { ids: taskListIds, locale: requestedLocale, targetOrganisationId } = validatedBody

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
      msg: 'Phase 1: Pre-loading documents for all task lists',
      taskListIds,
    })

    const allDocumentIds: number[] = []
    const taskListData: Array<{ id: number; name: string }> = []
    let documentPreloader: DocumentPreloader

    try {
      for (const taskListId of taskListIds) {
        // Validate access for this specific task list
        const accessValidation = await validateCloneAccess({
          collectionSlug: 'task-lists',
          req,
          sourceId: taskListId,
          targetOrgId: targetOrganisationId,
          user,
        })

        if (!accessValidation.isValid) {
          throw new CloneHttpError(
            `Task list ${taskListId}: ${accessValidation.error?.message ?? 'access denied'}`,
            accessValidation.error?.status ?? 403,
          )
        }

        // The name for the report only. `locale: 'all'` returns every locale, because a record
        // named in French alone has no German name and the report would show `undefined`.
        const sourceTaskList = await req.payload.findByID({
          collection: 'task-lists',
          depth: 0,
          id: taskListId,
          locale: 'all',
          req,
        })

        taskListData.push({
          id: sourceTaskList.id,
          name: getLocalizedValue(sourceTaskList.name, cloneLocales, locale),
        })

        // Read every locale, so a document that only a French rich text names still reaches
        // the preload. `false` is the only value that turns the fallback off.
        for (const cloneLocale of cloneLocales) {
          const localeSource = await req.payload.findByID({
            collection: 'task-lists',
            depth: 0,
            fallbackLocale: false,
            id: taskListId,
            locale: cloneLocale,
            req,
          })

          allDocumentIds.push(...scanTaskListForDocumentIds(localeSource))
        }
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
        stack: error instanceof Error ? error.stack : undefined,
        status,
        taskListIds,
      })

      return Response.json(
        { error: `Failed to clone task lists: ${getErrorMessage(error)}` },
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
        taskListIds,
      })

      return Response.json(
        { error: `Failed to clone task lists: ${getErrorMessage(error)}` },
        { status: 500 },
      )
    }

    const tracker = CloneStatisticsTracker.getInstance(transactionID)

    try {
      // PHASE 2: Clone task lists using the copied documents (INSIDE transaction)
      req.payload.logger.info({
        locale,
        msg: 'Phase 2: Cloning multiple task lists with single transaction',
        targetOrgId: targetOrganisationId,
        taskListIds,
        transactionID,
      })

      // Create a new request object with the transaction ID
      const transactionalReq: PayloadRequest = {
        ...req,
        transactionID,
      }

      // Process each task list within the SAME transaction
      for (const { id: taskListId, name } of taskListData) {
        tracker.startEntity(taskListId)
        tracker.setSourceInfo(taskListId, name, 'task-lists')

        // Execute the cloning process for this task list, one pass per locale
        const clonedTaskList = await createTaskList(
          transactionalReq,
          taskListId,
          targetOrganisationId,
          cloneLocales,
          documentPreloader,
        )

        tracker.setCloneInfo(clonedTaskList.id, clonedTaskList.name, 'task-lists')

        req.payload.logger.info({
          clonedId: clonedTaskList.id,
          msg: 'Cloned successfully',
          sourceId: taskListId,
        })

        tracker.endEntity()
      }

      // Commit the SINGLE transaction after ALL task lists are processed
      await req.payload.db.commitTransaction(transactionID)

      req.payload.logger.info({
        msg: 'All task lists cloned successfully',
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

      req.payload.logger.error({
        error: getErrorMessage(error),
        msg: 'Failed to clone task lists - transaction rolled back',
        stack: error instanceof Error ? error.stack : undefined,
        status,
        targetOrgId: targetOrganisationId,
        taskListIds,
        transactionID,
      })

      return Response.json(
        { error: `Failed to clone task lists: ${getErrorMessage(error)}` },
        { status },
      )
    } finally {
      // The tracker lives in a static map keyed by transaction id. Only this call frees it.
      CloneStatisticsTracker.disposeInstance(transactionID)
    }
  },
  method: 'post',
  path: '/clone',
}
