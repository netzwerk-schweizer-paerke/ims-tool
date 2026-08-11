'use client'
import { useField } from '@payloadcms/ui'
import { JSONFieldClientComponent } from 'payload'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ButtonCenterRight } from '@/components/graph/fields/graph/components/node-buttons'
import { processTaskParallelConnections } from '@/components/graph/fields/graph/flows/parallel/connection-definitions'
import { ConnectionsType, useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { Xwrapper } from '@/lib/xarrows/src'

type ComponentState = {
  connections: ConnectionsType
  textLeft: string
  textRight: string
}

const initialState: ComponentState = {
  connections: [
    {
      position: 'top',
      type: 'in',
    },
    {
      position: 'right',
      type: 'none',
    },
    {
      position: 'bottom',
      type: 'out',
    },
  ],
  textLeft: '',
  textRight: '',
}

export const ProcessTaskParallelField: JSONFieldClientComponent = (props) => {
  const {
    field: { required },
    path,
    validate,
  } = props

  const memoizedValidate = useCallback(
    (value: any, options: any) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
      return true // Validation passes when no validate function is provided
    },
    [validate, required],
  )

  const { setValue, value } = useField<ComponentState>({ path, validate: memoizedValidate })

  // Use local state for textareas to reduce re-renders of the entire component
  const [localTextLeft, setLocalTextLeft] = useState('')
  const [localTextRight, setLocalTextRight] = useState('')

  useEffect(() => {
    if (value) {
      // Only update local text if it differs from the field value
      if (value.textLeft !== localTextLeft) {
        setLocalTextLeft(value.textLeft || '')
      }
      if (value.textRight !== localTextRight) {
        setLocalTextRight(value.textRight || '')
      }
    } else {
      setValue(initialState)
    }
  }, [setValue, value, localTextLeft, localTextRight])

  // Debounced text update handlers
  const handleTextLeftChange = useCallback(
    (text: string) => {
      setLocalTextLeft(text)
      // Only update the actual value when necessary
      if (value && text !== value.textLeft) {
        setValue({ ...value, textLeft: text })
      }
    },
    [value, setValue],
  )

  const handleTextRightChange = useCallback(
    (text: string) => {
      setLocalTextRight(text)
      // Only update the actual value when necessary
      if (value && text !== value.textRight) {
        setValue({ ...value, textRight: text })
      }
    },
    [value, setValue],
  )

  // Memoize arrow hook to prevent recreation
  const { arrowSetId, isLoaded, ref, renderArrows, toggleConnectionType } = useArrows({
    connections: processTaskParallelConnections,
    setState: setValue,
    state: value,
  })

  // Memoize button click handlers
  const handleRightClick = useCallback(() => toggleConnectionType('right'), [toggleConnectionType])

  // Memoize arrows rendering to prevent recalculation
  const arrowsContent = useMemo(() => {
    return isLoaded ? renderArrows() : null
  }, [isLoaded, renderArrows])

  return (
    <div className={'process-task-parallel-block relative h-full'} ref={ref}>
      <Xwrapper>
        <div className={'grid size-full grid-cols-2'}>
          <BlockTaskWrapper>
            <RootTarget comboTarget={'left'} id={arrowSetId}>
              <TaskShapeWrapper mode={'edit'}>
                <textarea
                  className={
                    'textarea-lg flex size-full resize-none items-center justify-center rounded-2xl bg-transparent p-0 text-center leading-snug focus:outline-none'
                  }
                  onChange={(e) => handleTextLeftChange(e.target.value)}
                  value={localTextLeft}
                />
              </TaskShapeWrapper>
            </RootTarget>
          </BlockTaskWrapper>
          <BlockTaskWrapper>
            <RootTarget comboTarget={'right'} id={arrowSetId}>
              <TaskShapeWrapper mode={'edit'}>
                <textarea
                  className={
                    'textarea-lg flex size-full resize-none items-center justify-center rounded-2xl bg-transparent p-0 text-center leading-snug focus:outline-none'
                  }
                  onChange={(e) => handleTextRightChange(e.target.value)}
                  value={localTextRight}
                />
                <ButtonCenterRight onClickFn={handleRightClick} />
              </TaskShapeWrapper>
            </RootTarget>
            <OuterTargets id={arrowSetId} />
          </BlockTaskWrapper>
        </div>
        <div className={'x-arrows'}>{arrowsContent}</div>
      </Xwrapper>
    </div>
  )
}
