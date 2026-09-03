import { activityConnections } from '@/components/graph/fields/graph/activities/connection-definitions'
import { ArrowSpec } from '@/components/graph/fields/graph/lib/arrow-geometry'
import {
  ArrowDefinitions,
  isConnectionPosition,
  isConnectionType,
} from '@/components/graph/fields/graph/lib/connection-types'
import { ActivityTaskCompoundBlock } from '@/components/views/activity/overview/activity/block'
import { Activity } from '@/payload-types'

export type ActivityBlockArrows = { arrows: ArrowSpec[]; id: string }

const activityBlockTypes = new Set(['activity-io', 'activity-task'])

export const assignActivityBlockArrows = (activity: Activity): ActivityBlockArrows[] => {
  const arrowSet: ActivityBlockArrows[] = []

  for (const block of activity.blocks ?? []) {
    if (!activityBlockTypes.has(block.blockType)) continue

    const compoundBlock = block as ActivityTaskCompoundBlock
    for (const stored of compoundBlock.graph?.task?.connections ?? []) {
      const { position, type } = stored as { position?: unknown; type?: unknown }
      // The stored JSON declares both as bare strings, so skip a value no definition knows.
      if (!isConnectionPosition(position) || !isConnectionType(type)) continue

      // `satisfies` keeps each entry's literal type, so `find` returns a union of the three
      // concrete records. Widen it, or the union has no common key to index.
      const definitions: ArrowDefinitions | undefined = activityConnections.find(
        (c) => c.position === position,
      )?.definitions
      const arrows = definitions?.[type]
      if (!arrows?.length) continue

      arrowSet.push({ arrows, id: compoundBlock.id })
    }
  }

  return arrowSet
}
