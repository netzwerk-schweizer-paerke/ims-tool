import { isArray, isNumber } from 'es-toolkit/compat'
import { PayloadRequest } from 'payload'

import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { Activity, ActivityIOBlock, ActivityTaskBlock, TaskFlow, TaskList } from '@/payload-types'
import { isActivityIOBlock, isActivityTaskBlock } from '@/payload/assertions'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'

import { createTaskFlow, createTaskList } from './clone-task-flow-or-list'

type CloneActivityBlocksParams = {
  clonedActivity: Activity
  documentPreloader?: DocumentPreloader
  locale: string
  req: PayloadRequest
  targetOrgId: number
}

/**
 * Processes and clones all task blocks (task flows and task lists) within an activity
 * Updates the cloned activity with new task references
 * Tracks statistics for cloned blocks
 */
export async function cloneActivityBlocks(params: CloneActivityBlocksParams): Promise<void> {
  const { clonedActivity, documentPreloader, locale, req, targetOrgId } = params

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
            collection: 'task-flows',
            depth: 0,
            id: value,
            locale: locale as any,
            req,
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
            collection: 'task-lists',
            depth: 0,
            id: value,
            locale: locale as any,
            req,
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
        blockType: block.blockType,
        id: block.id,
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
      collection: 'activities',
      data: {
        blocks: finalBlocks,
      },
      id: clonedActivity.id,
      locale: locale as any,
      req: mergeReqContextTargetOrgId(req, targetOrgId),
    })
  }
}
