import { isArray, isNumber } from 'es-toolkit/compat'
import { PayloadRequest, TypedLocale } from 'payload'

import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { Activity, TaskFlow, TaskList } from '@/payload-types'
import { isActivityIOBlock, isActivityTaskBlock } from '@/payload/assertions'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'

import { createTaskFlow, createTaskList } from './clone-task-flow-or-list'

type RemapActivityTaskRelationsParams = {
  blocks: Activity['blocks']
  documentPreloader: DocumentPreloader
  /** The locales each nested task carries. It is the activity's own locale list. */
  locales: TypedLocale[]
  req: PayloadRequest
  targetOrgId: number
}

type TaskRelation =
  | { relationTo: 'task-flows'; value: number | TaskFlow }
  | { relationTo: 'task-lists'; value: number | TaskList }

/**
 * Clones the task flows and task lists one locale's blocks reference, and returns those blocks
 * with each relation pointed at its clone.
 *
 * The caller writes the result, so one locale costs one write. The tracker clones a task once
 * per activity, because two locales of one activity often reference the same task.
 */
export async function remapActivityTaskRelations(
  params: RemapActivityTaskRelationsParams,
): Promise<Activity['blocks']> {
  const { blocks, documentPreloader, locales, req, targetOrgId } = params

  if (!blocks) {
    return blocks
  }

  const tracker = CloneStatisticsTracker.getInstance(req.transactionID)
  const remapped: NonNullable<Activity['blocks']> = []

  for (const block of blocks) {
    if (
      !(isActivityTaskBlock(block) || isActivityIOBlock(block)) ||
      !isArray(block.relations?.tasks)
    ) {
      remapped.push(block)
      continue
    }

    const newRelations: TaskRelation[] = []

    for (const task of block.relations.tasks) {
      const { relationTo, value } = task

      // The endpoint reads the source at depth 2 to scan it, so `value` holds the whole task
      // rather than its id.
      const sourceTaskId = readRelationId(value)

      if (sourceTaskId === undefined) {
        continue
      }

      if (relationTo === 'task-flows') {
        const clonedId = await tracker.resolveClonedTaskId('task-flows', sourceTaskId, async () => {
          const clone = await createTaskFlow(
            req,
            sourceTaskId,
            targetOrgId,
            locales,
            documentPreloader,
          )
          return clone.id
        })
        newRelations.push({ relationTo, value: clonedId })
      } else if (relationTo === 'task-lists') {
        const clonedId = await tracker.resolveClonedTaskId('task-lists', sourceTaskId, async () => {
          const clone = await createTaskList(
            req,
            sourceTaskId,
            targetOrgId,
            locales,
            documentPreloader,
          )
          return clone.id
        })
        newRelations.push({ relationTo, value: clonedId })
      }
    }

    remapped.push({ ...block, relations: { tasks: newRelations } })
  }

  return remapped
}

/** Reads the task id from a relation, which holds either a raw id or the populated task. */
const readRelationId = (value: number | TaskFlow | TaskList): number | undefined => {
  if (isNumber(value)) {
    return value
  }

  return isNumber(value?.id) ? value.id : undefined
}
