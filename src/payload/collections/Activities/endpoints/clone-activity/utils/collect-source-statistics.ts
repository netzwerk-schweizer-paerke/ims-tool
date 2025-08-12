import { PayloadRequest } from 'payload'
import { isActivityIOBlock, isActivityTaskBlock } from '@/payload/assertions'
import { Activity } from '@/payload-types'
import { CloneStatisticsTracker } from './clone-statistics-tracker'

type CollectSourceStatsParams = {
  req: PayloadRequest
  sourceActivity: Activity
  tracker: CloneStatisticsTracker
}

/**
 * Collects comprehensive statistics from the source activity
 * including blocks, tasks, documents, and field population
 */
export async function collectSourceStatistics(
  params: CollectSourceStatsParams,
): Promise<void> {
  const { req, sourceActivity, tracker } = params

  // Collect basic source statistics
  const populatedFields = []
  if (sourceActivity.name) populatedFields.push('name')
  if (sourceActivity.description) populatedFields.push('description')
  if (sourceActivity.variant) populatedFields.push('variant')
  if (sourceActivity.blocks && sourceActivity.blocks.length > 0) populatedFields.push('blocks')
  if (sourceActivity.files && sourceActivity.files.length > 0) populatedFields.push('files')

  tracker.setSourceStats({
    id: sourceActivity.id,
    name: sourceActivity.name || '',
    hasDescription: !!sourceActivity.description,
    variant: sourceActivity.variant || '',
    blocksCount: sourceActivity.blocks?.length || 0,
    // Only count files that actually have documents attached (not null)
    filesCount:
      sourceActivity.files?.filter((f) => f.document !== null && f.document !== undefined)
        .length || 0,
    fieldsPopulated: populatedFields,
  })

  // Analyze blocks and tasks
  if (sourceActivity.blocks) {
    const blockTypes: string[] = []
    let totalTasks = 0
    let sourceTaskFlows = 0
    let sourceTaskLists = 0
    let taskFlowBlocksCount = 0
    let taskListBlocksCount = 0

    for (const block of sourceActivity.blocks) {
      blockTypes.push(block.blockType)
      if ((isActivityTaskBlock(block) || isActivityIOBlock(block)) && block.relations?.tasks) {
        for (const task of block.relations.tasks) {
          totalTasks++
          if (task.relationTo === 'task-flows') {
            sourceTaskFlows++
            // Fetch the task flow to count its blocks
            if (typeof task.value === 'number') {
              try {
                const taskFlow = await req.payload.findByID({
                  req,
                  collection: 'task-flows',
                  id: task.value,
                  depth: 0,
                })
                if (taskFlow?.blocks) {
                  taskFlowBlocksCount += taskFlow.blocks.length
                }
              } catch (e) {
                req.payload.logger.warn({
                  msg: 'Could not fetch task flow for counting',
                  id: task.value,
                })
              }
            }
          } else if (task.relationTo === 'task-lists') {
            sourceTaskLists++
            // Fetch the task list to count its blocks
            if (typeof task.value === 'number') {
              try {
                const taskList = await req.payload.findByID({
                  req,
                  collection: 'task-lists',
                  id: task.value,
                  depth: 0,
                })
                if (taskList?.items) {
                  taskListBlocksCount += taskList.items.length
                }
              } catch (e) {
                req.payload.logger.warn({
                  msg: 'Could not fetch task list for counting',
                  id: task.value,
                })
              }
            }
          }
        }
      }
    }

    tracker.setSourceStats({
      blockTypes,
      totalTasks,
      taskFlowsCount: sourceTaskFlows,
      taskListsCount: sourceTaskLists,
      taskFlowBlocksCount,
      taskListBlocksCount,
    })
  }
}