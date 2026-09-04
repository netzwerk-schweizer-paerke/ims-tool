import type { Endpoint, PayloadRequest } from 'payload'

import { z } from 'zod'

import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { getErrorStatus } from '@/payload/utilities/cloning/clone-http-error'
import { deleteCreatedDocuments } from '@/payload/utilities/cloning/delete-created-documents'
import { getErrorMessage } from '@/payload/utilities/cloning/error-utils'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'

import { type FetchLegacyDocsParams, FetchLegacyDocsSchema } from './schemas'
import { createCloneError } from './utils/error-utils'
import { prepareActivities, rewriteActivities } from './utils/process-activities'
import { FetchLegacyDocsTracker } from './utils/statistics-tracker'

export const fetchLegacyDocsTransactional: Endpoint = {
  handler: async (req) => {
    // Step 1: Verify authentication
    requireAuthentication(req)
    const user = req.user

    // Step 2: Validate and parse request parameters
    let validatedParams: FetchLegacyDocsParams
    try {
      const body = req.json ? await req.json() : {}
      // Check if we have an activityId in the path (for backward compatibility)
      validatedParams = FetchLegacyDocsSchema.parse({
        dryRun: body?.dryRun || false,
      })
    } catch (error) {
      return Response.json(
        createCloneError(
          'Invalid request parameters',
          error instanceof z.ZodError ? error.issues : String(error),
        ),
        { status: 400 },
      )
    }

    const { dryRun } = validatedParams

    // Step 3: Initialize statistics tracker
    const tracker = new FetchLegacyDocsTracker()
    tracker.initializeStatistics({
      activitiesProcessed: 0,
      activityBreakdown: [],
      documentsCreated: 0,
      errors: [],
      failedConversions: 0,
      linksConverted: 0,
      processedFields: 0,
      skippedFields: 0,
      startTime: Date.now(),
      totalLinksFound: 0,
    })

    // Phase 1 fills this list. The catch below deletes these documents after any later failure.
    let createdDocumentIds: number[] = []

    try {
      // Step 4: Determine which activities to process

      // Bulk processing mode - fetch all activities the user has access to
      const selectedOrgId = user?.selectedOrganisation
        ? typeof user.selectedOrganisation === 'object'
          ? user.selectedOrganisation.id
          : user.selectedOrganisation
        : null

      if (!selectedOrgId) {
        return Response.json(
          createCloneError(
            'No organisation selected',
            'User must have an organisation selected to process all activities',
          ),
          { status: 400 },
        )
      }

      // This endpoint creates documents in bulk. Authentication alone is not enough,
      // because access-definitions.md line 15 makes an organisation user read-only.
      if (
        !checkUserRoles([ROLE_SUPER_ADMIN], user) &&
        !checkOrganisationRoles([ROLE_SUPER_ADMIN], user, selectedOrgId)
      ) {
        req.payload.logger.warn(
          { organisationId: selectedOrgId, userId: user?.id },
          'access_denied: legacy document fetch requires the organisation admin role',
        )
        return Response.json(
          createCloneError(
            'Access denied',
            'You need the admin role in this organisation to fetch legacy documents',
          ),
          { status: 403 },
        )
      }

      // Fetch all activities from the selected organisation
      const activitiesResult = await req.payload.find({
        collection: 'activities',
        depth: 2,
        limit: 1000, // Process up to 1000 activities
        req,
        where: {
          organisation: {
            equals: selectedOrgId,
          },
        },
      })

      if (!activitiesResult.docs || activitiesResult.docs.length === 0) {
        return Response.json(
          createCloneError(
            'No activities found',
            'No activities found in the selected organisation',
          ),
          { status: 404 },
        )
      }

      // PHASE 1: Scan, download and create the documents with no transaction open. One create
      // costs seconds, and a dead legacy url must not stop the run.
      const prepared = await prepareActivities({
        activities: activitiesResult.docs,
        dryRun,
        req,
        tracker,
      })
      createdDocumentIds = prepared.createdDocumentIds

      if (!dryRun) {
        // PHASE 2: Rewrite the links inside one transaction, so the activity updates commit
        // together or not at all. The adapter throws when no connection is free.
        const transactionID = await req.payload.db.beginTransaction()

        if (transactionID === null) {
          throw new Error('The database adapter did not start a transaction')
        }

        // A query joins the transaction only when its own request carries the id. The original
        // `req` does not, so every write inside would run on a separate connection and survive
        // a rollback.
        const transactionalReq: PayloadRequest = { ...req, transactionID }

        try {
          await rewriteActivities({ prepared: prepared.activities, req: transactionalReq, tracker })
          await req.payload.db.commitTransaction(transactionID)
        } catch (error) {
          await req.payload.db.rollbackTransaction(transactionID)
          throw error
        }
      }

      // Finalize statistics
      const finalStats = tracker.getStatistics()
      finalStats.endTime = Date.now()

      const message = dryRun
        ? `Scanned ${finalStats.activitiesProcessed} activities, found ${finalStats.totalLinksFound} legacy links (dry run - no changes made)`
        : `Successfully processed ${finalStats.activitiesProcessed} activities, converted ${finalStats.linksConverted} of ${finalStats.totalLinksFound} legacy links`

      return Response.json({
        dryRun,
        message,
        statistics: finalStats,
        success: true,
      })
    } catch (error) {
      // Phase 1 committed each document on its own connection. Whatever failed after that, the
      // documents are orphans now, so the delete runs before the answer.
      await deleteCreatedDocuments(req, createdDocumentIds)

      const stats = tracker.getStatistics()
      stats.endTime = Date.now()

      const message = getErrorMessage(error)
      const status = getErrorStatus(error)

      req.payload.logger.error({
        error: message,
        msg: 'Failed to fetch legacy documents',
        stack: error instanceof Error ? error.stack : undefined,
        status,
      })

      // The overlay reads `error` first, so the cause must sit there and not in `details` alone.
      return Response.json(
        createCloneError(`Failed to fetch legacy documents: ${message}`, message, stats),
        { status },
      )
    }
  },
  method: 'post',
  path: '/fetch-legacy-docs',
}
