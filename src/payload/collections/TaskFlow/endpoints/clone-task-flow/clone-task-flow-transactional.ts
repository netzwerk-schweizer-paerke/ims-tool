import { Endpoint, PayloadRequest } from 'payload'
import { z } from 'zod'

import { toContentLocale } from '@/lib/locale-utils'
import { createTaskFlow } from '@/payload/collections/Activities/endpoints/clone/utils/clone-task-flow-or-list'
import { CloneHttpError, getErrorStatus } from '@/payload/utilities/cloning/clone-http-error'
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

export type TaskFlowCloneEndpointBodySchema = z.infer<typeof batchCloneBodySchema>

export type TaskFlowCloneEndpointResult =
  ReturnType<typeof formatValidationErrors> | { error: string } | {
      message: string
      results: GenericCloneStatisticsFinalized
    }

export const cloneTaskFlowTransactional: Endpoint = {
  handler: async (req) => {
    // Step 1: Verify authentication
    requireAuthentication(req)
    const user = req.user

    // Step 2: Validate and parse request body for task flow IDs
    let validatedBody: TaskFlowCloneEndpointBodySchema

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

    const { ids: taskFlowIds, locale: requestedLocale, targetOrganisationId } = validatedBody

    // Narrow the request locale to a configured content locale before any write starts.
    const locale = toContentLocale(requestedLocale, req.payload.config)

    if (!locale) {
      req.payload.logger.warn({
        msg: 'Unsupported locale in batch clone request',
        requestedLocale,
      })
      return Response.json({ error: 'Unsupported locale' }, { status: 400 })
    }

    const transactionID = await req.payload.db.beginTransaction()

    if (!transactionID) {
      return Response.json({ error: 'Failed to start database transaction' }, { status: 500 })
    }

    const tracker = CloneStatisticsTracker.getInstance(transactionID)

    try {
      req.payload.logger.info({
        locale,
        msg: 'Cloning multiple task flows with single transaction',
        targetOrgId: targetOrganisationId,
        taskFlowIds,
        transactionID,
      })

      // Create a new request object with the transaction ID
      const transactionalReq: PayloadRequest = {
        ...req,
        transactionID,
      }

      // Process each task flow within the SAME transaction
      for (const taskFlowId of taskFlowIds) {
        // Start tracking this entity
        tracker.startEntity(taskFlowId)

        // Validate access for this specific task flow
        const accessValidation = await validateCloneAccess({
          collectionSlug: 'task-flows',
          req: transactionalReq,
          sourceId: taskFlowId,
          targetOrgId: targetOrganisationId,
          user,
        })

        if (!accessValidation.isValid) {
          throw new CloneHttpError(
            `Task flow ${taskFlowId}: ${accessValidation.error?.message ?? 'access denied'}`,
            accessValidation.error?.status ?? 403,
          )
        }

        // Find the source task flow
        const sourceTaskFlow = await req.payload.findByID({
          collection: 'task-flows',
          depth: 0,
          id: taskFlowId,
          locale,
          req: transactionalReq,
        })

        // Set source info for current entity
        tracker.setSourceInfo(sourceTaskFlow.id, sourceTaskFlow.name, 'task-flows')

        if (!sourceTaskFlow) {
          throw new Error(`Source task flow ${taskFlowId} not found`)
        }

        // Execute the cloning process for this task flow
        const clonedTaskFlow = await createTaskFlow(
          transactionalReq,
          sourceTaskFlow,
          targetOrganisationId,
          locale,
        )

        tracker.setCloneInfo(clonedTaskFlow.id, clonedTaskFlow.name, 'task-flows')

        req.payload.logger.info({
          clonedId: clonedTaskFlow.id,
          msg: 'Cloned successfully',
          sourceId: sourceTaskFlow.id,
        })

        tracker.endEntity()
      }

      // Commit the SINGLE transaction after ALL task flows are processed
      await req.payload.db.commitTransaction(transactionID)

      req.payload.logger.info({
        msg: 'All task flows cloned successfully',
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
        msg: 'Failed to clone task flows - transaction rolled back',
        stack: error instanceof Error ? error.stack : undefined,
        status,
        targetOrgId: targetOrganisationId,
        taskFlowIds,
        transactionID,
      })

      return Response.json(
        { error: `Failed to clone task flows: ${getErrorMessage(error)}` },
        { status },
      )
    }
  },
  method: 'post',
  path: '/clone',
}
