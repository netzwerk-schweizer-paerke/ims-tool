'use client'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { ButtonCenterRight } from '@/components/graph/fields/graph/components/node-buttons'
import { ConnectionsType, useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { Xwrapper } from '@/lib/xarrows/src'
import { processTaskParallelConnections } from '@/components/graph/fields/graph/flows/parallel/connection-definitions'
import { JSONFieldClientComponent } from 'payload'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useField } from '@payloadcms/ui'

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
    path,
    validate,
    field: { required },
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

  const { value, setValue } = useField<ComponentState>({ path, validate: memoizedValidate })

  // Use local state for textareas to reduce re-renders of the entire component
  const [localTextLeft, setLocalTextLeft] = useState('')
  const [localTextRight, setLocalTextRight] = useState('')

  useEffect(() => {
    if (!value) {
      setValue(initialState)
    } else {
      // Only update local text if it differs from the field value
      if (value.textLeft !== localTextLeft) {
        setLocalTextLeft(value.textLeft || '')
      }
      if (value.textRight !== localTextRight) {
        setLocalTextRight(value.textRight || '')
      }
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
  const { arrowSetId, toggleConnectionType, ref, renderArrows, isLoaded } = useArrows({
    state: value,
    setState: setValue,
    connections: processTaskParallelConnections,
  })

  // Memoize button click handlers
  const handleRightClick = useCallback(() => toggleConnectionType('right'), [toggleConnectionType])

  // Memoize arrows rendering to prevent recalculation
  const arrowsContent = useMemo(() => {
    return isLoaded ? renderArrows() : null
  }, [isLoaded, renderArrows])

  return (
    <div ref={ref} className={'process-task-parallel-block relative h-full'}>
      <Xwrapper>
        <div className={'grid size-full grid-cols-2'}>
          <BlockTaskWrapper>
            <RootTarget id={arrowSetId} comboTarget={'left'}>
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
            <RootTarget id={arrowSetId} comboTarget={'right'}>
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
