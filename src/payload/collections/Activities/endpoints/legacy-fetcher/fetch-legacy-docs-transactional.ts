import type { Endpoint } from 'payload'

import { z } from 'zod'

import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'

import { type FetchLegacyDocsParams, FetchLegacyDocsSchema } from './schemas'
import { createCloneError } from './utils/error-utils'
import { processActivities } from './utils/process-activities'
import { FetchLegacyDocsTracker } from './utils/statistics-tracker'

export const fetchLegacyDocsTransactional: Endpoint = {
  handler: async (req) => {
    // Step 1: Verify authentication
    requireAuthentication(req)
    const user = req.user as any

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

    try {
      // Step 4: Determine which activities to process
      let activitiesToProcess: any[] = []

      // Bulk processing mode - fetch all activities the user has access to
      const selectedOrgId = user.selectedOrganisation
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

      activitiesToProcess = activitiesResult.docs

      // Step 5: Start transaction for atomic operation
      const transactionID = (await req.payload.db.beginTransaction()) as string

      try {
        // Step 6: Process activities using extracted logic
        await processActivities({
          activities: activitiesToProcess,
          dryRun,
          req,
          tracker,
        })

        // Step 7: Commit transaction
        await req.payload.db.commitTransaction(transactionID as any)

        // Step 8: Finalize statistics
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
        // Rollback transaction on error
        await req.payload.db.rollbackTransaction(transactionID as any)
        throw error
      }
    } catch (error) {
      const stats = tracker.getStatistics()
      stats.endTime = Date.now()

      return Response.json(
        createCloneError(
          'Failed to fetch legacy documents',
          error instanceof Error ? error.message : String(error),
          stats,
        ),
        { status: 500 },
      )
    }
  },
  method: 'post',
  path: '/fetch-legacy-docs',
}
