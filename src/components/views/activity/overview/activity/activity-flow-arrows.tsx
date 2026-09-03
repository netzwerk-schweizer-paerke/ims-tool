'use client'
import { useMemo } from 'react'

import '@/components/graph/fields/graph/lib/arrow-styles.css'
import { ArrowLayer, LayerArrow } from '@/components/graph/fields/graph/lib/arrow-layer'
import { assignActivityBlockArrows } from '@/components/views/activity/overview/activity/lib/assign-activity-block-arrows'
import { Activity } from '@/payload-types'

type Props = {
  activity: Activity
}

export const ActivityFlowArrows = ({ activity }: Props) => {
  const arrows = useMemo<LayerArrow[]>(
    () =>
      assignActivityBlockArrows(activity).flatMap(({ arrows, id }, entryIndex) =>
        arrows.map((spec, index) => {
          const start = `${id}-${spec.start}`
          const end = `${id}-${spec.end}`
          // The entry index keeps the key unique. Nothing stops a block from storing the
          // same position and type twice, and both entries then emit the same endpoints.
          return { ...spec, end, key: `${entryIndex}-${start}-${end}-${index}`, start }
        }),
      ),
    [activity],
  )

  return (
    <div className={'x-arrows absolute inset-0'}>
      <ArrowLayer arrows={arrows} />
    </div>
  )
}
