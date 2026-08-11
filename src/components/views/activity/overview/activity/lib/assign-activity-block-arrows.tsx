import { activityIOFieldConnections } from '@/components/graph/fields/graph/activities/io/connection-definitions'
import { activityTaskConnections } from '@/components/graph/fields/graph/activities/task/connection-definitions'
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

  const arrowSet: { arrows: any; id: string }[] = []

  for (const [blockType, blocks] of Object.entries(categorizedBlocks)) {
    const connections =
      blockType === 'activity-task' ? activityTaskConnections : activityIOFieldConnections

    for (const block of blocks) {
      const compoundBlock = block as ActivityTaskCompoundBlock
      const arrows = compoundBlock.graph?.task?.connections

      for (const arrow of arrows ?? []) {
        const definition = connections.find((c) => c.position === arrow.position)?.definitions
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
