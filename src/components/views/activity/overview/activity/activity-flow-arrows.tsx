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
      assignActivityBlockArrows(activity).flatMap(({ arrows, id }) =>
        arrows.map((spec, index) => {
          const start = `${id}-${spec.start}`
          const end = `${id}-${spec.end}`
          return { ...spec, end, key: `${start}-${end}-${index}`, start }
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
