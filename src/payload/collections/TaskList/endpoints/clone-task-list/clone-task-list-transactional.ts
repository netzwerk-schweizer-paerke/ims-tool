import { Endpoint, PayloadRequest } from 'payload'
import { z } from 'zod'

import { createTaskList } from '@/payload/collections/Activities/endpoints/clone/utils/clone-task-flow-or-list'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
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

    const { ids: taskListIds, locale, targetOrganisationId } = validatedBody

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
          throw new Error(
            `Access denied for task list ${taskListId}: ${accessValidation.error?.message}`,
          )
        }

        // Find the source task list
        const sourceTaskList = await req.payload.findByID({
          collection: 'task-lists',
          depth: 0,
          id: taskListId,
          locale: locale as any,
          req: transactionalReq,
        })

        // Set source info for current entity
        tracker.setSourceInfo(sourceTaskList.id, sourceTaskList.name, 'task-lists')

        if (!sourceTaskList) {
          throw new Error(`Source task list ${taskListId} not found`)
        }

        // Execute the cloning process for this task list
        const clonedTaskList = await createTaskList(
          transactionalReq,
          sourceTaskList,
          targetOrganisationId,
          locale,
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

      req.payload.logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        msg: 'Failed to clone task lists - transaction rolled back',
        targetOrgId: targetOrganisationId,
        taskListIds,
        transactionID,
      })

      return Response.json(
        {
          error: `Failed to clone task lists: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 500 },
      )
    }
  },
  method: 'post',
  path: '/clone',
}
