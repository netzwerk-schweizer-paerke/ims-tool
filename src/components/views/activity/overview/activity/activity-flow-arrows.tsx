'use client'
import { debounce } from 'es-toolkit'
import { useCallback, useEffect, useRef, useState } from 'react'

import '@/components/graph/fields/graph/lib/arrow-styles.css'
import { arrowStyle } from '@/components/graph/fields/graph/lib/arrow-style'
import { assignActivityBlockArrows } from '@/components/views/activity/overview/activity/lib/assign-activity-block-arrows'
import Xarrow, { useXarrow, xarrowPropsType } from '@/lib/xarrows/src'
import { Activity } from '@/payload-types'

type Props = {
  activity: Activity
}

export const ActivityFlowArrows = ({ activity }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const updateXarrow = useXarrow()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const reference = ref.current
    if (!reference) return

    const handleResize = debounce(() => {
      setIsLoaded(true)
      updateXarrow()
    }, 100)

    const resizeObserver = new ResizeObserver(handleResize)

    if (reference) {
      resizeObserver.observe(reference)
    }

    // Clean up function
    return () => {
      if (reference) {
        resizeObserver.unobserve(reference)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderArrows = useCallback(() => {
    const arrowSet = assignActivityBlockArrows(activity)

    return arrowSet.map(({ arrows, id }) => {
      return arrows.map((arrow: xarrowPropsType, index: number) => {
        const end = `${id}-${arrow.end}`
        const start = `${id}-${arrow.start}`
        const props = { ...arrow, end, start, ...arrowStyle }
        // Keyed by the endpoints, not the index: Xarrow holds position state, so an index
        // key lets React reuse one instance for a different start/end pair.
        return <Xarrow key={`${start}-${end}-${index}`} {...props} />
      })
    })
  }, [activity])

  return (
    <div className={'x-arrows absolute inset-0'} ref={ref}>
      {isLoaded && renderArrows()}
    </div>
  )
}
