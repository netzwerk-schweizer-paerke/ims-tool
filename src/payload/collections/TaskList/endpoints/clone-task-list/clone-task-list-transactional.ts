import { Endpoint, PayloadRequest } from 'payload'
import { z } from 'zod'

import { toContentLocale } from '@/lib/locale-utils'
import { createTaskList } from '@/payload/collections/Activities/endpoints/clone/utils/clone-task-flow-or-list'
import { CloneHttpError, getErrorStatus } from '@/payload/utilities/cloning/clone-http-error'
import { getCloneLocales } from '@/payload/utilities/cloning/clone-locales'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
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

    const transactionID = await req.payload.db.beginTransaction()

    if (!transactionID) {
      return Response.json({ error: 'Failed to start database transaction' }, { status: 500 })
    }

    const tracker = CloneStatisticsTracker.getInstance(transactionID)

    try {
      req.payload.logger.info({
        locale,
        msg: 'Cloning multiple task lists with single transaction',
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
      for (const taskListId of taskListIds) {
        tracker.startEntity(taskListId)

        // Validate access for this specific task list
        const accessValidation = await validateCloneAccess({
          collectionSlug: 'task-lists',
          req: transactionalReq,
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

        // The name for the report only. It reads the request locale, with the fallback on, so
        // an untranslated record still gets a readable label.
        const sourceTaskList = await req.payload.findByID({
          collection: 'task-lists',
          depth: 0,
          id: taskListId,
          locale,
          req: transactionalReq,
        })

        // Set source info for current entity
        tracker.setSourceInfo(sourceTaskList.id, sourceTaskList.name, 'task-lists')

        // Execute the cloning process for this task list, one pass per locale
        const clonedTaskList = await createTaskList(
          transactionalReq,
          taskListId,
          targetOrganisationId,
          cloneLocales,
        )

        tracker.setCloneInfo(clonedTaskList.id, clonedTaskList.name, 'task-lists')

        req.payload.logger.info({
          clonedId: clonedTaskList.id,
          msg: 'Cloned successfully',
          sourceId: sourceTaskList.id,
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
