import { Endpoint, PayloadRequest } from 'payload'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'
import { validateCloneAccess } from '@/payload/utilities/cloning/validate-access'
import { cloneActivity } from '@/payload/collections/Activities/endpoints/clone/utils/clone-activity'
import { z } from 'zod'
import { formatValidationErrors } from '@/payload/utilities/cloning/validation-schemas'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import { GenericCloneStatisticsFinalized } from '@/payload/utilities/cloning/types'
import { preloadDocuments } from '@/payload/utilities/cloning/document-preloader'
import { scanActivityForDocumentIds } from '@/payload/utilities/cloning/document-scanner'

const batchCloneBodySchema = z.object({
  targetOrganisationId: z.number(),
  ids: z.array(z.number().min(1)).min(1, 'At least one ID is required'),
  locale: z.string(),
})

export type ActivityCloneEndpointBodySchema = z.infer<typeof batchCloneBodySchema>

export type ActivityCloneEndpointResult =
  | {
      message: string
      results: GenericCloneStatisticsFinalized
    }
  | ReturnType<typeof formatValidationErrors>
  | { error: string }

export const cloneActivityTransactional: Endpoint = {
  path: '/clone',
  method: 'post',
  handler: async (req) => {
    // Step 1: Verify authentication
    requireAuthentication(req)
    const user = req.user

    // Step 2: Validate and parse request body for activity IDs
    let validatedBody: ActivityCloneEndpointBodySchema

    try {
      const rawBody = req.json ? await req.json() : {}
      const bodyResult = batchCloneBodySchema.safeParse(rawBody)

      if (!bodyResult.success) {
        req.payload.logger.warn({
          msg: 'Invalid batch clone request body',
          errors: formatValidationErrors(bodyResult.error),
          rawBody,
        })
        return Response.json(formatValidationErrors(bodyResult.error), { status: 400 })
      }
      validatedBody = bodyResult.data
    } catch (error) {
      req.payload.logger.error({
        msg: 'Error parsing batch clone request body',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { targetOrganisationId, ids: activityIds, locale } = validatedBody

    const transactionID = await req.payload.db.beginTransaction()

    if (!transactionID) {
      return Response.json({ error: 'Failed to start database transaction' }, { status: 500 })
    }

    const tracker = CloneStatisticsTracker.getInstance(transactionID)

    try {
      // PHASE 1: Pre-load all documents (OUTSIDE transaction to prevent timeouts)
      req.payload.logger.info({
        msg: 'Phase 1: Pre-loading documents for all activities',
        activityIds,
      })

      const allDocumentIds: number[] = []
      const activityData: Array<{ id: number; activity: any }> = []

      // First, fetch all activities and scan for document IDs
      for (const activityId of activityIds) {
        // Validate access for this specific activity
        const accessValidation = await validateCloneAccess({
          req,
          user,
          sourceId: activityId,
          targetOrgId: targetOrganisationId,
          collectionSlug: 'activities',
        })

        if (!accessValidation.isValid) {
          throw new Error(
            `Access denied for activity ${activityId}: ${accessValidation.error?.message}`,
          )
        }

        // Find the source activity
        const sourceActivity = await req.payload.findByID({
          req,
          collection: 'activities',
          id: activityId,
          locale: locale as any,
          depth: 2, // Need depth for scanning nested content
        })

        if (!sourceActivity) {
          throw new Error(`Source activity ${activityId} not found`)
        }

        activityData.push({ id: activityId, activity: sourceActivity })

        // Scan for all document IDs in this activity
        const documentIds = scanActivityForDocumentIds(sourceActivity)
        allDocumentIds.push(...documentIds)
      }

      // Pre-load all unique documents
      const uniqueDocumentIds = Array.from(new Set(allDocumentIds))
      const documentPreloader = await preloadDocuments(req, uniqueDocumentIds)

      req.payload.logger.info({
        msg: 'Phase 1 completed - documents pre-loaded',
        documentCount: uniqueDocumentIds.length,
        preloadedCount: documentPreloader.preloadedDocuments.size,
        errorCount: documentPreloader.errors.length,
      })

      // PHASE 2: Clone activities using pre-loaded documents (INSIDE transaction)
      req.payload.logger.info({
        msg: 'Phase 2: Cloning activities with pre-loaded documents',
        transactionID,
      })

      // Create a new request object with the transaction ID
      const transactionalReq: PayloadRequest = {
        ...req,
        transactionID,
      }

      // Process each activity within the SAME transaction
      for (const { id: activityId, activity: sourceActivity } of activityData) {
        // Start tracking this entity
        tracker.startEntity(activityId)

        // Set source info for current entity
        tracker.setSourceInfo(sourceActivity.id, sourceActivity.name, 'activities')

        // Execute the cloning process for this activity
        const clonedActivity = await cloneActivity({
          req: transactionalReq,
          sourceActivity,
          targetOrgId: targetOrganisationId,
          locale,
          documentPreloader,
        })

        tracker.setCloneInfo(clonedActivity.id, clonedActivity.name, 'activities')

        req.payload.logger.info({
          msg: 'Cloned successfully',
          clonedId: clonedActivity.id,
          sourceId: sourceActivity.id,
        })

        tracker.endEntity()
      }

      // Commit the SINGLE transaction after ALL activities are processed
      await req.payload.db.commitTransaction(transactionID)

      req.payload.logger.info({
        msg: 'All activities cloned successfully',
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
        msg: 'Failed to clone activities - transaction rolled back',
        error: error instanceof Error ? error.message : 'Unknown error',
        activityIds,
        targetOrgId: targetOrganisationId,
        transactionID,
      })

      return Response.json(
        {
          error: `Failed to clone activities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 500 },
      )
    }
  },
}
