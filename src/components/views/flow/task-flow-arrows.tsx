'use client'
import { debounce } from 'es-toolkit'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import '@/components/graph/fields/graph/lib/arrow-styles.css'
import {
  RootTargetLeftName,
  RootTargetName,
  RootTargetRightName,
} from '@/components/graph/fields/graph/lib/root-target'
import { ProcessTaskCompoundBlock } from '@/components/views/flow/flow-block'
import { assignBlockArrows } from '@/components/views/flow/lib/assign-block-arrows'
import Xarrow, { useXarrow } from '@/lib/xarrows/src'

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

  // Memoize arrow set calculation - only recalculate when block data changes
  const arrowSet = useMemo(() => assignBlockArrows(taskFlowBlock), [taskFlowBlock])

  const renderArrows = useCallback(() => {
    return arrowSet.map(({ arrows, blockType, id, leftId, rightId }, index) => (
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
            // Single regex replacement instead of 6 separate .replace() calls
            startPrefix = startPrefix.replace(parallelBlockRegex, parallelBlockReplacer)
            endPrefix = endPrefix.replace(parallelBlockRegex, parallelBlockReplacer)
          }
          // arrowStyle is already merged in assignBlockArrows
          const props = {
            ...arrow,
            end: endPrefix,
            start: startPrefix,
          }
          return <Xarrow key={startPrefix + endPrefix + index} {...props} />
        })}
      </Fragment>
    ))
  }, [arrowSet])

  return (
    <div className={'x-arrows absolute inset-0'} ref={ref}>
      {isLoaded && renderArrows()}
    </div>
  )
}
