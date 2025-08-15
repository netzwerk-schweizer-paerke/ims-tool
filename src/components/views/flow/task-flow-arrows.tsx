'use client'
import { debounce } from 'es-toolkit'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import '@/components/graph/fields/graph/lib/arrow-styles.css'
import { arrowStyle } from '@/components/graph/fields/graph/lib/arrow-style'
import { ProcessTaskCompoundBlock } from '@/components/views/flow/flow-block'
import { assignBlockArrows } from '@/components/views/flow/lib/assign-block-arrows'
import {
  RootTargetLeftName,
  RootTargetName,
  RootTargetRightName,
} from '@/components/graph/fields/graph/lib/root-target'
import Xarrow, { useXarrow } from '@/lib/xarrows/src'

type Props = {
  taskFlowBlock: ProcessTaskCompoundBlock
}

export const TaskFlowArrows: React.FC<Props> = ({ taskFlowBlock }) => {
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
    const arrowSet = assignBlockArrows(taskFlowBlock)
    return arrowSet.map(({ arrows, id, leftId, rightId, blockType }, index) => (
      <Fragment key={id + index}>
        {arrows.map((arrow, index) => {
          let startPrefix =
            id === leftId &&
            arrow.originalArrow.position === 'right' &&
            arrow.originalArrow.type === 'in'
              ? `${rightId}-${RootTargetName}`
              : `${id}-${arrow.start}`
          let endPrefix =
            id === leftId &&
            arrow.originalArrow.position === 'right' &&
            arrow.originalArrow.type === 'out'
              ? `${rightId}-${RootTargetName}`
              : `${id}-${arrow.end}`

          if (blockType === 'proc-task-p') {
            if (id === leftId) {
              return null
            }
            startPrefix = startPrefix.replace(
              `right-${RootTargetLeftName}`,
              `left-${RootTargetName}`,
            )
            endPrefix = endPrefix.replace(`right-${RootTargetLeftName}`, `left-${RootTargetName}`)
            startPrefix = startPrefix
              .replace(RootTargetLeftName, RootTargetName)
              .replace(RootTargetRightName, RootTargetName)
            endPrefix = endPrefix
              .replace(RootTargetLeftName, RootTargetName)
              .replace(RootTargetRightName, RootTargetName)
          }
          const props = {
            ...arrow,
            start: startPrefix,
            end: endPrefix,
            ...arrowStyle,
          }
          return <Xarrow key={startPrefix + endPrefix + index} {...props} />
        })}
      </Fragment>
    ))
  }, [taskFlowBlock])

  return (
    <div ref={ref} className={'x-arrows absolute inset-0'}>
      {isLoaded && renderArrows()}
    </div>
  )
}
