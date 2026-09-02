import type { PayloadRequest } from 'payload'

import type { Activity } from '@/payload-types'

import type { LegacyDocsActivityBreakdown, LegacyDocsLinkDetail } from '../types'

import { convertLinks } from './convert-links'
import { downloadExternalDocument } from './download-external-document'
import { scanLegacyLinks } from './scan-legacy-links'
import { FetchLegacyDocsTracker } from './statistics-tracker'

interface ProcessActivitiesParams {
  activities: Activity[]
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
  const activityBreakdown: LegacyDocsActivityBreakdown[] = []

  // Process each activity
  for (const activity of activities) {
    const activityStats = {
      documentsCreated: 0,
      failedConversions: 0,
      id: activity.id.toString(),
      linkDetails: [] as LegacyDocsLinkDetail[],
      linksConverted: 0,
      linksFound: 0,
      name: activity.name,
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
          error: 'Activity has no organisation',
          timestamp: Date.now(),
          url: `Activity: ${activity.name}`,
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
        converted: false,
        fieldLabel: link.fieldLabel,
        locationPath: link.locationPath,
        parentEntity: link.parentEntity,
        url: link.url,
      }))

      tracker.updateStatistics({
        processedFields:
          tracker.getStatistics().processedFields + activityTracker.getStatistics().processedFields,
        skippedFields:
          tracker.getStatistics().skippedFields + activityTracker.getStatistics().skippedFields,
        totalLinksFound: tracker.getStatistics().totalLinksFound + legacyLinks.length,
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
              error: errorMessage,
              timestamp: Date.now(),
              url: link.url,
            })
            activityStats.failedConversions++
            tracker.increment('failedConversions')
            if (activityStats.linkDetails && activityStats.linkDetails[i]) {
              activityStats.linkDetails[i].error = errorMessage
            }
          }
        }

        // Convert links in the activity
        const updatedActivity = await convertLinks(activity, activityDocumentMap, tracker)

        // Update the activity with converted content
        await req.payload.update({
          collection: 'activities',
          data: updatedActivity,
          id: activity.id,
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
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        url: `Activity: ${activity.name}`,
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
