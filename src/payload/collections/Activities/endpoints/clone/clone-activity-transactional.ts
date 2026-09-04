import { Endpoint, PayloadRequest, TypedLocale } from 'payload'
import { z } from 'zod'

import { toContentLocale } from '@/lib/locale-utils'
import { Activity } from '@/payload-types'
import { cloneActivity } from '@/payload/collections/Activities/endpoints/clone/utils/clone-activity'
import {
  CloneHttpError,
  getErrorStatus,
  getValidationDetails,
} from '@/payload/utilities/cloning/clone-http-error'
import { getCloneLocales, hasLocaleContent } from '@/payload/utilities/cloning/clone-locales'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import { preloadDocuments } from '@/payload/utilities/cloning/document-preloader'
import { scanActivityForDocumentIds } from '@/payload/utilities/cloning/document-scanner'
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

export type ActivityCloneEndpointBodySchema = z.infer<typeof batchCloneBodySchema>

export type ActivityCloneEndpointResult =
  ReturnType<typeof formatValidationErrors> | { error: string } | {
      message: string
      results: GenericCloneStatisticsFinalized
    }

export const cloneActivityTransactional: Endpoint = {
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

    const { ids: activityIds, locale: requestedLocale, targetOrganisationId } = validatedBody

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
      // PHASE 1: Pre-load all documents (OUTSIDE transaction to prevent timeouts)
      req.payload.logger.info({
        activityIds,
        msg: 'Phase 1: Pre-loading documents for all activities',
      })

      const allDocumentIds: number[] = []
      const activityData: Array<{
        id: number
        sourcesByLocale: Map<TypedLocale, Activity>
      }> = []

      // First, fetch all activities and scan for document IDs
      for (const activityId of activityIds) {
        // Validate access for this specific activity
        const accessValidation = await validateCloneAccess({
          collectionSlug: 'activities',
          req,
          sourceId: activityId,
          targetOrgId: targetOrganisationId,
          user,
        })

        if (!accessValidation.isValid) {
          throw new CloneHttpError(
            `Activity ${activityId}: ${accessValidation.error?.message ?? 'access denied'}`,
            accessValidation.error?.status ?? 403,
          )
        }

        // Read every locale, so a document that only a French rich text names still reaches
        // the preload. The fallback would otherwise answer with the German content.
        const sourcesByLocale = new Map<TypedLocale, Activity>()

        for (const cloneLocale of cloneLocales) {
          const sourceActivity = await req.payload.findByID({
            collection: 'activities',
            depth: 2, // Need depth for scanning nested content
            fallbackLocale: false,
            id: activityId,
            locale: cloneLocale,
            req,
          })

          sourcesByLocale.set(cloneLocale, sourceActivity)

          // Scan for all document IDs in this locale of the activity
          allDocumentIds.push(...scanActivityForDocumentIds(sourceActivity))
        }

        activityData.push({ id: activityId, sourcesByLocale })
      }

      // Pre-load all unique documents
      const uniqueDocumentIds = Array.from(new Set(allDocumentIds))
      const documentPreloader = await preloadDocuments(req, uniqueDocumentIds)

      req.payload.logger.info({
        documentCount: uniqueDocumentIds.length,
        errorCount: documentPreloader.errors.length,
        msg: 'Phase 1 completed - documents pre-loaded',
        preloadedCount: documentPreloader.preloadedDocuments.size,
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
      for (const { id: activityId, sourcesByLocale } of activityData) {
        // Start tracking this entity
        tracker.startEntity(activityId)

        // The label of the report. It prefers the request locale, because 4 of 104 activities
        // have no German name and the panel would otherwise show `undefined`.
        const sourceName =
          [locale, ...cloneLocales]
            .map((code) => sourcesByLocale.get(code))
            .find((source) => source && hasLocaleContent(source))?.name ?? ''

        tracker.setSourceInfo(activityId, sourceName, 'activities')

        // Execute the cloning process for this activity, one pass per locale
        const clonedActivity = await cloneActivity({
          documentPreloader,
          locales: cloneLocales,
          req: transactionalReq,
          sourceId: activityId,
          sourcesByLocale,
          targetOrgId: targetOrganisationId,
        })

        tracker.setCloneInfo(clonedActivity.id, clonedActivity.name, 'activities')

        req.payload.logger.info({
          clonedId: clonedActivity.id,
          msg: 'Cloned successfully',
          sourceId: activityId,
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

      const status = getErrorStatus(error)
      const details = getValidationDetails(error)

      req.payload.logger.error({
        activityIds,
        details,
        error: getErrorMessage(error),
        msg: 'Failed to clone activities - transaction rolled back',
        stack: error instanceof Error ? error.stack : undefined,
        status,
        targetOrgId: targetOrganisationId,
        transactionID,
      })

      return Response.json(
        {
          details,
          error: `Failed to clone activities: ${getErrorMessage(error)}`,
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
}
