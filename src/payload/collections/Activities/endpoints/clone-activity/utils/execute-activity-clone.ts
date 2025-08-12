import { PayloadRequest } from 'payload'
import { Activity } from '@/payload-types'
import { CloneStatistics } from '@/payload/collections/Activities/types/clone-statistics'
import { CloneStatisticsTracker } from './clone-statistics-tracker'
import { collectSourceStatistics } from './collect-source-statistics'
import { stripActivity } from './strip-activity'
import { cloneActivityDocuments } from './clone-activity-documents'
import { cloneActivityBlocks } from './clone-activity-blocks'

type ExecuteActivityCloneParams = {
  req: PayloadRequest
  sourceActivity: Activity
  targetOrgId: number
  locale?: string
  failTest?: boolean
}

type ExecuteActivityCloneResult = {
  clonedActivityId: number
  statistics: CloneStatistics
}

/**
 * Main execution function that orchestrates the entire activity cloning process
 * This function should be called within a transaction context
 * 
 * Steps:
 * 1. Initialize statistics tracking
 * 2. Collect source activity statistics
 * 3. Strip and create the base cloned activity
 * 4. Clone associated documents
 * 5. Clone task blocks (flows and lists)
 * 6. Finalize statistics
 */
export async function executeActivityClone(
  params: ExecuteActivityCloneParams,
): Promise<ExecuteActivityCloneResult> {
  const { req, sourceActivity, targetOrgId, locale, failTest } = params

  // Initialize the statistics tracker
  const tracker = CloneStatisticsTracker.getInstance()
  tracker.reset()

  req.payload.logger.debug({ msg: 'Source activity found', sourceActivity: sourceActivity.id })

  // Step 1: Collect source activity statistics
  await collectSourceStatistics({
    req,
    sourceActivity,
    tracker,
  })

  // Step 2: Strip activity data for initial clone
  const strippedActivity = await stripActivity(
    sourceActivity,
    req,
    targetOrgId,
    locale as string,
  )

  req.payload.logger.debug({ msg: 'Activity stripped' })

  // Step 3: Clone the activity (initial version without document relationships)
  // Pass targetOrganisationId in context to bypass the organisation field hook's default behavior
  const clonedActivity = await req.payload.create({
    req: {
      ...req,
      context: {
        ...req.context,
        targetOrganisationId: targetOrgId,
      },
    },
    collection: 'activities',
    data: strippedActivity,
    locale: locale as any,
    depth: 0,
  })

  if (!clonedActivity) {
    throw new Error('Failed to clone activity')
  }

  req.payload.logger.debug({
    msg: 'Cloned activity created',
    clonedActivity: clonedActivity.id,
  })

  // TEST: Intentionally fail the transaction if requested
  if (failTest) {
    throw new Error('TEST: Intentionally failing transaction to test rollback')
  }

  // Collect cloned activity initial statistics
  tracker.setClonedStats({
    id: clonedActivity.id,
    name: clonedActivity.name || '',
    hasDescription: !!clonedActivity.description,
    variant: clonedActivity.variant || '',
    blocksCount: clonedActivity.blocks?.length || 0,
  })

  // Step 4: Clone associated documents (if any)
  await cloneActivityDocuments({
    req,
    sourceActivity,
    clonedActivityId: clonedActivity.id,
    targetOrgId,
    tracker,
    locale,
  })

  // Step 5: Process the blocks and clone related tasks
  await cloneActivityBlocks({
    req,
    clonedActivity,
    targetOrgId,
    tracker,
    locale,
  })

  // Update final cloned files count
  tracker.setClonedStats({
    filesCount: tracker.getStatistics().cloned.documentsCloned,
  })

  // Finalize statistics and calculate completeness
  const statistics = tracker.finalize()

  return {
    clonedActivityId: clonedActivity.id,
    statistics,
  }
}