'use client'
import { useMemo } from 'react'

import '@/components/graph/fields/graph/lib/arrow-styles.css'
import { ArrowLayer, LayerArrow } from '@/components/graph/fields/graph/lib/arrow-layer'
import { ProcessTaskCompoundBlock } from '@/components/views/flow/flow-block'
import { resolveBlockArrows } from '@/components/views/flow/lib/resolve-block-arrows'

type Props = {
  taskFlowBlock: ProcessTaskCompoundBlock
}

export const TaskFlowArrows = ({ taskFlowBlock }: Props) => {
  const arrows = useMemo<LayerArrow[]>(
    () =>
      resolveBlockArrows(taskFlowBlock).map(({ end, entryIndex, index, spec, start }) => {
        const startId = `${start.halfId}-${start.target}`
        const endId = `${end.halfId}-${end.target}`

        // The entry index keeps the key unique. Nothing stops a block from storing the
        // same position and type twice, and both entries then emit the same endpoints.
        return {
          ...spec,
          end: endId,
          key: `${entryIndex}-${startId}-${endId}-${index}`,
          start: startId,
        }
      }),
    [taskFlowBlock],
  )

  return (
    <div className={'x-arrows absolute inset-0'}>
      <ArrowLayer arrows={arrows} />
    </div>
  )
}
