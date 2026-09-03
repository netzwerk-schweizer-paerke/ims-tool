'use client'
import { useMemo } from 'react'

import '@/components/graph/fields/graph/lib/arrow-styles.css'
import { ArrowLayer, LayerArrow } from '@/components/graph/fields/graph/lib/arrow-layer'
import {
  RootTargetLeftName,
  RootTargetName,
  RootTargetRightName,
} from '@/components/graph/fields/graph/lib/root-target'
import { ProcessTaskCompoundBlock } from '@/components/views/flow/flow-block'
import { assignBlockArrows } from '@/components/views/flow/lib/assign-block-arrows'

// Pre-compiled regex for parallel block ID transformations (avoids 6 replace calls per arrow)
const parallelBlockRegex = new RegExp(
  `right-${RootTargetLeftName}|${RootTargetLeftName}|${RootTargetRightName}`,
  'g',
)

// Replacement function for parallel block transformations
const parallelBlockReplacer = (match: string): string => {
  if (match === `right-${RootTargetLeftName}`) return `left-${RootTargetName}`
  return RootTargetName
}

type Props = {
  taskFlowBlock: ProcessTaskCompoundBlock
}

export const TaskFlowArrows = ({ taskFlowBlock }: Props) => {
  const arrows = useMemo<LayerArrow[]>(
    () =>
      assignBlockArrows(taskFlowBlock).flatMap(
        ({ arrows, blockType, connection, id, leftId, rightId }) => {
          // Both halves of a parallel block hold the same stored connections, so the left
          // half would draw a duplicate of every arrow the right half already draws.
          if (blockType === 'proc-task-p' && id === leftId) return []

          return arrows.map((spec, index) => {
            let start =
              id === leftId && connection.position === 'right' && connection.type === 'in'
                ? `${rightId}-${RootTargetName}`
                : `${id}-${spec.start}`
            let end =
              id === leftId && connection.position === 'right' && connection.type === 'out'
                ? `${rightId}-${RootTargetName}`
                : `${id}-${spec.end}`

            if (blockType === 'proc-task-p') {
              // Single regex replacement instead of 6 separate .replace() calls
              start = start.replace(parallelBlockRegex, parallelBlockReplacer)
              end = end.replace(parallelBlockRegex, parallelBlockReplacer)
            }

            return { ...spec, end, key: `${start}-${end}-${index}`, start }
          })
        },
      ),
    [taskFlowBlock],
  )

  return (
    <div className={'x-arrows absolute inset-0'}>
      <ArrowLayer arrows={arrows} />
    </div>
  )
}
