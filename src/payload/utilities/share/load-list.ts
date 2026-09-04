import type { Payload, TypedLocale } from 'payload'

import { logger } from '@/lib/logger'
import { TaskList } from '@/payload-types'

export type ListBreadcrumb = {
  blockId: string
  id: number
  name: string
}

export type LoadedList = {
  activity: ListBreadcrumb | null
  listBlock: TaskList
}

type Args = {
  listId: number
  locale?: TypedLocale
  organisationId: number
  payload: Payload
}

const isTaskListArray = (listRelation: unknown): listRelation is TaskList[] =>
  Array.isArray(listRelation) &&
  listRelation.every(
    (list) =>
      typeof list === 'object' && list !== null && 'id' in list && typeof list.id === 'number',
  )

/**
 * Reads a list and the activity block that references it.
 *
 * `overrideAccess: true` with an explicit organisation filter, because the public share page has
 * no session. The organisation always comes from the caller, never from the URL.
 */
export const loadList = async ({
  listId,
  locale,
  organisationId,
  payload,
}: Args): Promise<LoadedList | null> => {
  const listBlock = await payload
    .find({
      collection: 'task-lists',
      depth: 2,
      locale,
      overrideAccess: true,
      where: {
        and: [{ id: { equals: listId }, organisation: { equals: organisationId } }],
      },
    })
    .then((res) => {
      if (res.docs.length === 0) {
        return null
      }
      if (res.docs.length > 1) {
        logger.warn('admin/views/list/index: More than one list block found')
      }
      return res.docs[0]
    })

  if (!listBlock) {
    return null
  }

  const activity = await payload
    .find({
      collection: 'activities',
      depth: 2,
      // An omitted limit resolves to 10, which would hide the referencing activity in a park
      // that holds more. The sweep must see every activity.
      limit: 0,
      locale,
      overrideAccess: true,
      where: {
        and: [{ organisation: { equals: organisationId } }],
      },
    })
    .then((res) => {
      let blockId = ''
      const activities = res.docs.filter((doc) =>
        doc.blocks?.some((block) => {
          const listRelation = block.relations?.tasks
            ?.filter((task) => task.relationTo === 'task-lists')
            .map((task) => task.value)
          if (isTaskListArray(listRelation) && listRelation.some((list) => list.id === listId)) {
            blockId = block.id as string
            return true
          }
          return false
        }),
      )

      if (activities.length === 0) {
        // An orphaned list — no activity block references it. The list itself still renders;
        // only the breadcrumb is unavailable.
        logger.warn('admin/views/list/index: No activity references this list')
        return null
      }
      if (activities.length > 1) {
        logger.warn('admin/views/list/index: More than one activity found')
      }

      return {
        blockId,
        id: activities[0].id,
        name: activities[0].name,
      }
    })

  return { activity, listBlock }
}
