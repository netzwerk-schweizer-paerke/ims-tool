import type { PayloadRequest } from 'payload'
import { scanLegacyLinks } from './scan-legacy-links'
import { downloadExternalDocument } from './download-external-document'
import { convertLinks } from './convert-links'
import { FetchLegacyDocsTracker } from './statistics-tracker'
import type { LegacyDocsStatistics } from '../types'

interface ProcessActivitiesParams {
  activities: any[]
  dryRun: boolean
  req: PayloadRequest
  tracker: FetchLegacyDocsTracker
}

export async function processActivities({
  activities,
  dryRun,
  req,
  tracker,
}: ProcessActivitiesParams): Promise<void> {
  const globalDocumentMap = new Map<string, number>() // Global URL to document ID mapping
  const activityBreakdown: any[] = []

  // Process each activity
  for (const activity of activities) {
    const activityStats = {
      id: activity.id.toString(),
      name: activity.name,
      linksFound: 0,
      linksConverted: 0,
      documentsCreated: 0,
      failedConversions: 0,
      linkDetails: [] as Array<{
        url: string
        parentEntity: string
        fieldLabel: string
        locationPath: string
        converted?: boolean
        error?: string
      }>,
    }

    try {
      // Validate access permissions for each activity
      const orgId = activity.organisation
        ? typeof activity.organisation === 'object'
          ? activity.organisation.id
          : activity.organisation
        : null

      if (!orgId) {
        tracker.addError({
          url: `Activity: ${activity.name}`,
          error: 'Activity has no organisation',
          timestamp: Date.now(),
        })
        continue
      }

      // Create a temporary tracker for this activity
      const activityTracker = new FetchLegacyDocsTracker()
      activityTracker.reset()

      // Scan for legacy links in this activity
      const legacyLinks = await scanLegacyLinks(activity, activityTracker, req)
      activityStats.linksFound = legacyLinks.length

      // Add link details to statistics
      activityStats.linkDetails = legacyLinks.map((link) => ({
        url: link.url,
        parentEntity: link.parentEntity,
        fieldLabel: link.fieldLabel,
        locationPath: link.locationPath,
        converted: false,
      }))

      tracker.updateStatistics({
        totalLinksFound: tracker.getStatistics().totalLinksFound + legacyLinks.length,
        processedFields:
          tracker.getStatistics().processedFields + activityTracker.getStatistics().processedFields,
        skippedFields:
          tracker.getStatistics().skippedFields + activityTracker.getStatistics().skippedFields,
      })

      if (legacyLinks.length > 0 && !dryRun) {
        // Process each legacy link
        const activityDocumentMap = new Map<string, number>()

        for (let i = 0; i < legacyLinks.length; i++) {
          const link = legacyLinks[i]
          try {
            // Check if we already have this document from another activity
            if (globalDocumentMap.has(link.url)) {
              activityDocumentMap.set(link.url, globalDocumentMap.get(link.url)!)
              activityStats.linksConverted++
              if (activityStats.linkDetails && activityStats.linkDetails[i]) {
                activityStats.linkDetails[i].converted = true
              }
            } else {
              // Download and create new document
              const documentId = await downloadExternalDocument(
                link.url,
                orgId as number,
                req,
                tracker,
              )
              if (documentId) {
                globalDocumentMap.set(link.url, documentId)
                activityDocumentMap.set(link.url, documentId)
                activityStats.documentsCreated++
                activityStats.linksConverted++
                tracker.increment('documentsCreated')
                if (activityStats.linkDetails && activityStats.linkDetails[i]) {
                  activityStats.linkDetails[i].converted = true
                }
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            tracker.addError({
              url: link.url,
              error: errorMessage,
              timestamp: Date.now(),
            })
            activityStats.failedConversions++
            tracker.increment('failedConversions')
            if (activityStats.linkDetails && activityStats.linkDetails[i]) {
              activityStats.linkDetails[i].error = errorMessage
            }
          }
        }

        // Convert links in the activity
        const updatedActivity = await convertLinks(activity, activityDocumentMap, tracker, req)

        // Update the activity with converted content
        await req.payload.update({
          collection: 'activities',
          id: activity.id,
          data: updatedActivity,
          req,
        })

        tracker.updateStatistics({
          linksConverted: tracker.getStatistics().linksConverted + activityStats.linksConverted,
        })
      }

      tracker.increment('activitiesProcessed')
      activityBreakdown.push(activityStats)
    } catch (error) {
      tracker.addError({
        url: `Activity: ${activity.name}`,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      })
      activityBreakdown.push(activityStats)
    }
  }

  // Update final statistics with activity breakdown
  const currentStats = tracker.getStatistics()
  tracker.updateStatistics({
    ...currentStats,
    activityBreakdown,
  })
}
