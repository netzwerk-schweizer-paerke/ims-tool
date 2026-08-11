'use client'
import { useField } from '@payloadcms/ui'
import { JSONFieldClientComponent } from 'payload'
import { useCallback, useEffect, useMemo } from 'react'

import { ButtonCenterRight } from '@/components/graph/fields/graph/components/node-buttons'
import { processTaskParallelConnections } from '@/components/graph/fields/graph/flows/parallel/connection-definitions'
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
  textLeft: string
  textRight: string
}

const createInitialState = (): ComponentState => ({
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
})

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

  // Use the centralized text field hook instead of local implementations
  const { handleTextChange: handleTextLeftChange, localText: localTextLeft } = useTextField(
    value,
    setValue,
    '',
    'textLeft',
  )
  const { handleTextChange: handleTextRightChange, localText: localTextRight } = useTextField(
    value,
    setValue,
    '',
    'textRight',
  )

  // Initialize state once
  useEffect(() => {
    if (!value) {
      // `true` keeps the form clean — applying a default is not a user edit
      setValue(createInitialState(), true)
    }
  }, [setValue, value])

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
