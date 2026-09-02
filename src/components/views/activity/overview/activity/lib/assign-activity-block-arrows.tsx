import { activityConnections } from '@/components/graph/fields/graph/activities/connection-definitions'
import {
  ConnectionDefinition,
  ConnectionType,
} from '@/components/graph/fields/graph/lib/connection-types'
import { ActivityTaskCompoundBlock } from '@/components/views/activity/overview/activity/block'
import { Activity } from '@/payload-types'

export const assignActivityBlockArrows = (activity: Activity) => {
  const categorizedBlocks = {
    'activity-io': [],
    'activity-task': [],
  }

  for (const block of activity.blocks ?? []) {
    if (block.blockType in categorizedBlocks) {
      // @ts-expect-error - categorizedBlocks has no index signature for blockType
      categorizedBlocks[block.blockType].push(block)
    }
  }

  const arrowSet: {
    arrows: NonNullable<ConnectionDefinition['definitions'][ConnectionType]>
    id: string
  }[] = []

  for (const blocks of Object.values(categorizedBlocks)) {
    for (const block of blocks) {
      const compoundBlock = block as ActivityTaskCompoundBlock
      const arrows = compoundBlock.graph?.task?.connections

      for (const arrow of arrows ?? []) {
        const definition = activityConnections.find(
          (c) => c.position === arrow.position,
        )?.definitions
        if (!definition) {
          continue
        }
        // @ts-expect-error - definition is keyed by arrow.type without an index signature
        const displayArrows = definition[arrow.type]?.flat() || []
        if (displayArrows.length > 0) {
          arrowSet.push({ arrows: displayArrows, id: compoundBlock.id })
        }
      }
    }
  }

  return arrowSet.flat()
}
