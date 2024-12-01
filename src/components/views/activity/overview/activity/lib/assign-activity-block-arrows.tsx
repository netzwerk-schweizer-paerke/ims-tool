import { Activity } from '@/payload-types'
import { activityTaskConnections } from '@/components/graph/fields/graph/activities/task/connection-definitions'
import { activityIOFieldConnections } from '@/components/graph/fields/graph/activities/io/connection-definitions'
import { ActivityTaskCompoundBlock } from '@/components/views/activity/overview/activity/block'

export const assignActivityBlockArrows = (activity: Activity) => {
  const categorizedBlocks = {
    'activity-task': [],
    'activity-io': [],
  }

  activity.blocks?.forEach((block) => {
    if (block.blockType in categorizedBlocks) {
      // @ts-ignore
      categorizedBlocks[block.blockType].push(block)
    }
  })

  const arrowSet: { arrows: any; id: string }[] = []

  Object.entries(categorizedBlocks).forEach(([blockType, blocks]) => {
    const connections =
      blockType === 'activity-task' ? activityTaskConnections : activityIOFieldConnections

    blocks.forEach((block) => {
      const compoundBlock = block as ActivityTaskCompoundBlock
      const arrows = compoundBlock.graph?.task?.connections

      arrows?.forEach((arrow) => {
        const definition = connections.find((c) => c.position === arrow.position)?.definitions
        if (!definition) {
          return
        }
        // @ts-ignore
        const displayArrows = definition[arrow.type].flat()
        if (displayArrows.length > 0) {
          arrowSet.push({ arrows: displayArrows, id: compoundBlock.id })
        }
      })
    })
  })

  return arrowSet.flat()
}
