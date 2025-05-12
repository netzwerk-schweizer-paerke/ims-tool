'use client'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import {
  ButtonBottomCenter,
  ButtonCenterRight,
  ButtonTopCenter,
} from '@/components/graph/fields/graph/components/node-buttons'
import { activityTaskConnections } from './connection-definitions'
import { ConnectionsType, useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'

import '@/components/graph/fields/graph/lib/arrow-styles.css'
import { Xwrapper } from '@/lib/xarrows/src'
import { JSONFieldClientComponent } from 'payload'
import { useCallback, useEffect, useMemo } from 'react'
import { useField } from '@payloadcms/ui'
import useTextField from '@/components/graph/fields/graph/hooks/use-text-field'

type ComponentState = {
  connections: ConnectionsType
  text: string
}

const initialState: ComponentState = {
  connections: [
    {
      position: 'top',
      type: 'none',
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
  text: '',
}

export const ActivityTaskField: JSONFieldClientComponent = (props) => {
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

  // Use the centralized text field hook instead of local implementation
  const { localText, handleTextChange } = useTextField(value, setValue)

  useEffect(() => {
    if (!value) {
      setValue(initialState)
    }
  }, [setValue, value])

  // Memoize arrow hook to prevent recreation
  const { arrowSetId, toggleConnectionType, ref, renderArrows, isLoaded } = useArrows({
    state: value,
    setState: setValue,
    connections: activityTaskConnections,
  })

  // Memoize button click handlers
  const handleRightClick = useCallback(() => toggleConnectionType('right'), [toggleConnectionType])
  const handleBottomClick = useCallback(
    () => toggleConnectionType('bottom'),
    [toggleConnectionType],
  )
  const handleTopClick = useCallback(() => toggleConnectionType('top'), [toggleConnectionType])

  // Memoize arrows rendering to prevent recalculation
  const arrowsContent = useMemo(() => {
    return isLoaded ? renderArrows() : null
  }, [isLoaded, renderArrows])

  return (
    <div ref={ref}>
      <Xwrapper>
        <BlockTaskWrapper>
          <RootTarget id={arrowSetId}>
            <TaskShapeWrapper mode={'edit'}>
              <textarea
                className={
                  'textarea-lg flex size-full resize-none items-center justify-center rounded-2xl bg-transparent p-0 text-center leading-snug focus:outline-none'
                }
                onChange={(e) => handleTextChange(e.target.value)}
                value={localText}
              />
              <ButtonCenterRight onClickFn={handleRightClick} />
              <ButtonBottomCenter onClickFn={handleBottomClick} />
              <ButtonTopCenter onClickFn={handleTopClick} />
            </TaskShapeWrapper>
          </RootTarget>
          <OuterTargets id={arrowSetId} />
          <div className={'x-arrows'}>{arrowsContent}</div>
        </BlockTaskWrapper>
      </Xwrapper>
    </div>
  )
}
