import type { Payload, TypedLocale } from 'payload'

import { logger } from '@/lib/logger'
import { TaskFlow } from '@/payload-types'

export type FlowBreadcrumb = {
  blockId: string
  blockTitle: string
  id: number
  name: string
}

export type LoadedFlow = {
  activity: FlowBreadcrumb | null
  flowBlock: TaskFlow
}

type Args = {
  flowId: number
  locale?: TypedLocale
  organisationId: number
  payload: Payload
}

const isTaskFlowArray = (flowRelation: unknown): flowRelation is TaskFlow[] =>
  Array.isArray(flowRelation) &&
  flowRelation.every(
    (flow) =>
      typeof flow === 'object' && flow !== null && 'id' in flow && typeof flow.id === 'number',
  )

/**
 * Reads a flow and the activity block that references it.
 *
 * `overrideAccess: true` with an explicit organisation filter, because the public share page has
 * no session. The organisation always comes from the caller, never from the URL.
 */
export const loadFlow = async ({
  flowId,
  locale,
  organisationId,
  payload,
}: Args): Promise<LoadedFlow | null> => {
  const flowBlock = await payload
    .find({
      collection: 'task-flows',
      depth: 2,
      locale,
      overrideAccess: true,
      where: {
        and: [{ id: { equals: flowId }, organisation: { equals: organisationId } }],
      },
    })
    .then((res) => {
      if (res.docs.length === 0) {
        return null
      }
      if (res.docs.length > 1) {
        logger.warn('admin/views/flow/index: More than one flow block found')
      }
      return res.docs[0]
    })

  if (!flowBlock) {
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
      let blockTitle = ''
      const activities = res.docs.filter((doc) =>
        doc.blocks?.some((block) => {
          const flowRelation = block.relations?.tasks
            ?.filter((task) => task.relationTo === 'task-flows')
            .map((task) => task.value)
          if (isTaskFlowArray(flowRelation) && flowRelation.some((flow) => flow.id === flowId)) {
            blockId = block.id as string
            blockTitle = block?.graph?.task?.text as string
            return true
          }
          return false
        }),
      )

      if (activities.length === 0) {
        // An orphaned flow — no activity block references it. The flow itself still renders;
        // only the breadcrumb is unavailable.
        logger.warn('admin/views/flow/index: No activity references this flow')
        return null
      }
      if (activities.length > 1) {
        logger.warn('admin/views/flow/index: More than one activity found')
      }

      return {
        blockId,
        blockTitle,
        id: activities[0].id,
        name: activities[0].name,
      }
    })

  return { activity, flowBlock }
}
