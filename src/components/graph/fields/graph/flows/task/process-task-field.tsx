'use client'
import { useField } from '@payloadcms/ui'
import { JSONFieldClientComponent } from 'payload'
import { useCallback, useEffect, useMemo } from 'react'

import {
  ButtonBottomCenter,
  ButtonCenterRight,
  ButtonTopCenter,
} from '@/components/graph/fields/graph/components/node-buttons'
import { processTaskConnections } from '@/components/graph/fields/graph/flows/task/connection-definitions'
import { useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import useTextField from '@/components/graph/fields/graph/hooks/use-text-field'
import { ConnectionsType } from '@/components/graph/fields/graph/lib/connection-types'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { Xwrapper } from '@/lib/xarrows/src'

type ComponentState = {
  connections: ConnectionsType
  text: string
}

const createInitialState = (): ComponentState => ({
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
})

export const ProcessTaskField: JSONFieldClientComponent = (props) => {
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

  // Use the centralized text field hook instead of local implementation
  const { handleTextChange, localText } = useTextField(value, setValue)

  useEffect(() => {
    if (!value) {
      // `true` keeps the form clean — applying a default is not a user edit
      setValue(createInitialState(), true)
    }
  }, [setValue, value])

  // Memoize arrow hook to prevent recreation
  const { arrowSetId, isLoaded, ref, renderArrows, toggleConnectionType } = useArrows({
    connections: processTaskConnections,
    setState: setValue,
    state: value,
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
    <div className={'process-task-parallel-block relative h-full'} ref={ref}>
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
