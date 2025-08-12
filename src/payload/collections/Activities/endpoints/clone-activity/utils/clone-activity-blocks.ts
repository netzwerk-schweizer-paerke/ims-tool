import { PayloadRequest } from 'payload'
import { isArray, isNumber } from 'lodash-es'
import { isActivityIOBlock, isActivityTaskBlock } from '@/payload/assertions'
import { Activity, ActivityIOBlock, ActivityTaskBlock, TaskFlow, TaskList } from '@/payload-types'
import { CloneStatisticsTracker } from './clone-statistics-tracker'
import { createTaskFlow, createTaskList } from './create-task'

type CloneActivityBlocksParams = {
  req: PayloadRequest
  clonedActivity: Activity
  targetOrgId: number
  tracker: CloneStatisticsTracker
  locale?: string
}

/**
 * Processes and clones all task blocks (task flows and task lists) within an activity
 * Updates the cloned activity with new task references
 * Tracks statistics for cloned blocks
 */
export async function cloneActivityBlocks(
  params: CloneActivityBlocksParams,
): Promise<void> {
  const { req, clonedActivity, targetOrgId, tracker, locale } = params

  if (!clonedActivity.blocks) {
    return
  }

  const updatedBlocks: (ActivityIOBlock | ActivityTaskBlock)[] = []
  const clonedBlockTypes: string[] = []
  let clonedTaskFlowBlocks = 0
  let clonedTaskListBlocks = 0

  for (const block of clonedActivity.blocks) {
    clonedBlockTypes.push(block.blockType)
    const newRelations: (
      | { relationTo: 'task-flows'; value: number | TaskFlow }
      | { relationTo: 'task-lists'; value: number | TaskList }
    )[] = []

    if (
      (isActivityTaskBlock(block) || isActivityIOBlock(block)) &&
      isArray(block.relations?.tasks)
    ) {
      for (const task of block.relations.tasks) {
        const { relationTo, value } = task

        req.payload.logger.debug({ msg: 'before createHandler', relationTo })

        if (relationTo === 'task-flows' && isNumber(value)) {
          // Get the task flow
          const taskFlow = await req.payload.findByID({
            req,
            collection: 'task-flows',
            id: value,
            locale: locale as any,
            depth: 0,
          })

          req.payload.logger.debug({ msg: 'before createTaskFlow', value: taskFlow.id })
          const newTaskFlow = await createTaskFlow(
            req,
            taskFlow,
            targetOrgId,
            locale as string,
          )

          if (newTaskFlow) {
            newRelations.push({ relationTo, value: newTaskFlow.id })

            // Count blocks in the cloned task flow (task flows have blocks)
            if ('blocks' in newTaskFlow && Array.isArray(newTaskFlow.blocks)) {
              clonedTaskFlowBlocks += newTaskFlow.blocks.length
            }
          }

          req.payload.logger.debug({
            msg: 'after createTaskFlow',
            newTaskFlow: newTaskFlow?.id,
          })
        }

        if (relationTo === 'task-lists' && isNumber(value)) {
          // Get the task list
          const taskList = await req.payload.findByID({
            req,
            collection: 'task-lists',
            id: value,
            locale: locale as any,
            depth: 0,
          })

          req.payload.logger.debug({ msg: 'before createTaskList', value: taskList.id })
          const newTaskList = await createTaskList(
            req,
            taskList,
            targetOrgId,
            locale as string,
          )

          if (newTaskList) {
            newRelations.push({ relationTo, value: newTaskList.id })

            // Count items in the cloned task list (task lists have items, not blocks)
            if ('items' in newTaskList && Array.isArray(newTaskList.items)) {
              clonedTaskListBlocks += newTaskList.items.length
            }
          }

          req.payload.logger.debug({
            msg: 'after createTaskList',
            newTaskList: newTaskList?.id,
          })
        }
      }
    }

    if (newRelations.length > 0) {
      updatedBlocks.push({
        id: block.id,
        blockType: block.blockType,
        relations: { tasks: newRelations },
      })
    }
  }

  req.payload.logger.debug({ msg: 'updating cloned activity', updatedBlocks })

  if (updatedBlocks.length > 0) {
    await req.payload.update({
      req: {
        ...req,
        context: {
          ...req.context,
          targetOrganisationId: targetOrgId,
        },
      },
      collection: 'activities',
      id: clonedActivity.id,
      data: {
        blocks: updatedBlocks,
      },
    })
  }

  // Update final block statistics
  tracker.setClonedStats({
    blockTypes: clonedBlockTypes,
    totalTasks:
      tracker.getStatistics().cloned.taskFlowsCloned +
      tracker.getStatistics().cloned.taskListsCloned,
  })
  tracker.setTaskFlowBlocksCloned(clonedTaskFlowBlocks)
  tracker.setTaskListBlocksCloned(clonedTaskListBlocks)
}