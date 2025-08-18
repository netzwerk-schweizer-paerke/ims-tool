import { PayloadRequest } from 'payload'
import { isArray, isNumber } from 'es-toolkit/compat'
import { isActivityIOBlock, isActivityTaskBlock } from '@/payload/assertions'
import { Activity, ActivityIOBlock, ActivityTaskBlock, TaskFlow, TaskList } from '@/payload-types'
import { createTaskFlow, createTaskList } from './clone-task-flow-or-list'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

type CloneActivityBlocksParams = {
  req: PayloadRequest
  clonedActivity: Activity
  targetOrgId: number
  locale: string
  documentPreloader?: DocumentPreloader
}

/**
 * Processes and clones all task blocks (task flows and task lists) within an activity
 * Updates the cloned activity with new task references
 * Tracks statistics for cloned blocks
 */
export async function cloneActivityBlocks(params: CloneActivityBlocksParams): Promise<void> {
  const { req, clonedActivity, targetOrgId, locale, documentPreloader } = params

  const tracker = CloneStatisticsTracker.getInstance(req.transactionID)

  if (!clonedActivity.blocks) {
    return
  }

  const updatedBlocks: (ActivityIOBlock | ActivityTaskBlock)[] = []
  let clonedTaskFlowBlocks = 0
  let clonedTaskListBlocks = 0

  // Blocks on activity level
  for (const block of clonedActivity.blocks) {
    const newRelations: (
      | { relationTo: 'task-flows'; value: number | TaskFlow }
      | { relationTo: 'task-lists'; value: number | TaskList }
    )[] = []

    tracker.addSourceBlock()

    if (
      (isActivityTaskBlock(block) || isActivityIOBlock(block)) &&
      isArray(block.relations?.tasks)
    ) {
      // Polymorphic relationship on blocks
      for (const task of block.relations.tasks) {
        const { relationTo, value } = task

        tracker.addSourceRelatedItem()

        req.payload.logger.debug({ msg: 'before createHandler', relationTo })

        if (relationTo === 'task-flows' && isNumber(value)) {
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
            documentPreloader,
          )

          if (newTaskFlow) {
            newRelations.push({ relationTo, value: newTaskFlow.id })

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
            documentPreloader,
          )

          if (newTaskList) {
            newRelations.push({ relationTo, value: newTaskList.id })

            if ('items' in newTaskList && Array.isArray(newTaskList.items)) {
              clonedTaskListBlocks += newTaskList.items.length
            }
          }

          req.payload.logger.debug({
            msg: 'after createTaskList',
            newTaskList: newTaskList?.id,
          })
        }

        tracker.addClonedRelatedItem()
      }
    }

    if (newRelations.length > 0) {
      updatedBlocks.push({
        id: block.id,
        blockType: block.blockType,
        relations: { tasks: newRelations },
      })
    }

    tracker.addClonedBlock()
  }

  req.payload.logger.debug({ msg: 'updating cloned activity', updatedBlocks })

  if (updatedBlocks.length > 0) {
    // Create the full blocks array by merging updated blocks with unchanged blocks
    const finalBlocks = clonedActivity.blocks.map((block) => {
      // Find if this block has updates (task relations)
      const updatedBlock = updatedBlocks.find((ub) => ub.id === block.id)
      if (updatedBlock) {
        // Merge the updated relations with the original block data
        return {
          ...block,
          relations: updatedBlock.relations,
        }
      }
      // Return the original block unchanged
      return block
    })

    await req.payload.update({
      req: mergeReqContextTargetOrgId(req, targetOrgId),
      locale: locale as any,
      collection: 'activities',
      id: clonedActivity.id,
      data: {
        blocks: finalBlocks,
      },
    })
  }
}
