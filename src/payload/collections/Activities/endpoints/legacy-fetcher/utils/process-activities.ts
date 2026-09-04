import type { PayloadRequest } from 'payload'

import type { Activity } from '@/payload-types'

import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

import type { LegacyDocsActivityBreakdown, LegacyDocsLinkDetail } from '../types'

import { convertLinks } from './convert-links'
import { downloadExternalDocument } from './download-external-document'
import { scanLegacyLinks } from './scan-legacy-links'
import { FetchLegacyDocsTracker } from './statistics-tracker'

export interface PreparedActivities {
  activities: PreparedActivity[]
  /** Every document phase 1 created, for the cleanup after a rollback. */
  createdDocumentIds: number[]
}

/** One activity after phase 1, ready for the link rewrite of phase 2. */
export interface PreparedActivity {
  activity: Activity
  /** Legacy url to the id of the document phase 1 created or reused for it. */
  documentMap: Map<string, number>
  stats: LegacyDocsActivityBreakdown
}

interface PrepareActivitiesParams {
  activities: Activity[]
  dryRun: boolean
  req: PayloadRequest
  tracker: FetchLegacyDocsTracker
}

interface RewriteActivitiesParams {
  prepared: PreparedActivity[]
  req: PayloadRequest
  tracker: FetchLegacyDocsTracker
}

/**
 * Phase 1. Scans each activity for legacy links, downloads each file once and creates its
 * document.
 *
 * No transaction is open here, so a dead url or a failed create is recorded on the tracker and
 * skipped. The link then keeps its url, and the run continues with the next one.
 */
export async function prepareActivities({
  activities,
  dryRun,
  req,
  tracker,
}: PrepareActivitiesParams): Promise<PreparedActivities> {
  const globalDocumentMap = new Map<string, number>() // Global URL to document ID mapping
  const createdDocumentIds: number[] = []
  const prepared: PreparedActivity[] = []
  const activityBreakdown: LegacyDocsActivityBreakdown[] = []

  for (const activity of activities) {
    const stats: LegacyDocsActivityBreakdown = {
      documentsCreated: 0,
      failedConversions: 0,
      id: activity.id.toString(),
      linkDetails: [] as LegacyDocsLinkDetail[],
      linksConverted: 0,
      linksFound: 0,
      name: activity.name,
    }

    const orgId = getIdFromRelation(activity.organisation)

    if (orgId === null) {
      tracker.addError({
        error: 'Activity has no organisation',
        timestamp: Date.now(),
        url: `Activity: ${activity.name}`,
      })
      continue
    }

    // Create a temporary tracker for this activity
    const activityTracker = new FetchLegacyDocsTracker()

    // Scan for legacy links in this activity
    const legacyLinks = await scanLegacyLinks(activity, activityTracker, req)
    stats.linksFound = legacyLinks.length

    // Add link details to statistics
    stats.linkDetails = legacyLinks.map((link) => ({
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

    const documentMap = new Map<string, number>()

    if (legacyLinks.length > 0 && !dryRun) {
      for (const [index, link] of legacyLinks.entries()) {
        // Check if we already have this document from another activity
        if (globalDocumentMap.has(link.url)) {
          documentMap.set(link.url, globalDocumentMap.get(link.url)!)
        } else {
          const documentId = await downloadExternalDocument(link.url, orgId, req, tracker)

          if (documentId === null) {
            continue
          }

          globalDocumentMap.set(link.url, documentId)
          documentMap.set(link.url, documentId)
          createdDocumentIds.push(documentId)
          stats.documentsCreated++
          tracker.increment('documentsCreated')
        }

        stats.linksConverted++
        if (stats.linkDetails?.[index]) {
          stats.linkDetails[index].converted = true
        }
      }
    }

    tracker.increment('activitiesProcessed')
    activityBreakdown.push(stats)
    prepared.push({ activity, documentMap, stats })
  }

  // Update final statistics with activity breakdown
  tracker.updateStatistics({
    ...tracker.getStatistics(),
    activityBreakdown,
  })

  return { activities: prepared, createdDocumentIds }
}

/**
 * Phase 2. Rewrites the legacy links of each prepared activity and writes the activity.
 *
 * This runs inside the endpoint's transaction, and the update is a Payload operation. Payload
 * rolls the transaction back when it fails, and a later write would commit on its own
 * connection, so a failure ends the run here and the endpoint answers the error.
 */
export async function rewriteActivities({
  prepared,
  req,
  tracker,
}: RewriteActivitiesParams): Promise<void> {
  for (const { activity, documentMap, stats } of prepared) {
    // An activity with no copied document has no link to rewrite, so nothing is written.
    if (documentMap.size === 0) {
      continue
    }

    try {
      const updatedActivity = await convertLinks(activity, documentMap, tracker)

      await req.payload.update({
        collection: 'activities',
        data: updatedActivity,
        id: activity.id,
        req,
      })

      tracker.updateStatistics({
        linksConverted: tracker.getStatistics().linksConverted + stats.linksConverted,
      })
    } catch (error) {
      tracker.addError({
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        url: `Activity: ${activity.name}`,
      })

      throw error
    }
  }
}
