'use client'
import { useField } from '@payloadcms/ui'
import { JSONFieldClientComponent } from 'payload'
import { memo, useCallback, useEffect, useMemo } from 'react'

import { BooleanButton } from '@/components/graph/fields/graph/components/boolean-button'
import {
  ButtonBottomCenter,
  ButtonCenterRight,
  ButtonTopCenter,
} from '@/components/graph/fields/graph/components/node-buttons'
import { processTestConnections } from '@/components/graph/fields/graph/flows/test/connection-definitions'
import { ConnectionsType, useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import useTextField from '@/components/graph/fields/graph/hooks/use-text-field'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { TestShapeWrapper } from '@/components/graph/wrappers/test-shape-wrapper'
import { Xwrapper } from '@/lib/xarrows/src'

enum BooleanOutput {
  FALSE = 'false',
  None = 'none',
  TRUE = 'true',
}

type ComponentState = {
  bottomBoolean: BooleanOutput
  connections: ConnectionsType
  leftBoolean: BooleanOutput
  rightBoolean: BooleanOutput
  text: string
}

const initialState: ComponentState = {
  bottomBoolean: BooleanOutput.TRUE,
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
  leftBoolean: BooleanOutput.FALSE,
  rightBoolean: BooleanOutput.None,
  text: '',
}

const DisplayBoolean: React.FC<{ booleanOutput: BooleanOutput }> = memo(({ booleanOutput }) => {
  const booleanOutputMap = useMemo(
    () => ({
      [BooleanOutput.FALSE]: 'False',
      [BooleanOutput.None]: 'None',
      [BooleanOutput.TRUE]: 'True',
    }),
    [],
  )

  const booleanOutputCssMap = useMemo(
    () => ({
      [BooleanOutput.FALSE]: 'text-red-600',
      [BooleanOutput.None]: '',
      [BooleanOutput.TRUE]: 'text-green-600',
    }),
    [],
  )

  return (
    <div className={`text-center text-sm font-bold ${booleanOutputCssMap[booleanOutput]}`}>
      {booleanOutputMap[booleanOutput]}
    </div>
  )
})

DisplayBoolean.displayName = 'DisplayBoolean'

export const ProcessTestField: JSONFieldClientComponent = (props) => {
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

  // Initialize state only once
  useEffect(() => {
    if (!value) {
      setValue(initialState)
    }
  }, [setValue, value])

  // Memoize arrow hook to prevent recreation
  const { arrowSetId, isLoaded, ref, renderArrows, toggleConnectionType } = useArrows({
    connections: processTestConnections,
    setState: setValue,
    state: value,
  })

  // Memoize toggleBoolean handler
  const toggleBoolean = useCallback(
    (position: 'bottomBoolean' | 'leftBoolean' | 'rightBoolean') => {
      if (!value) return

      const currentBoolean = value[position]
      let newBoolean = BooleanOutput.None
      if (currentBoolean === BooleanOutput.None) {
        newBoolean = BooleanOutput.FALSE
      } else if (currentBoolean === BooleanOutput.FALSE) {
        newBoolean = BooleanOutput.TRUE
      }
      setValue({ ...value, [position]: newBoolean })
    },
    [value, setValue],
  )

  // Memoize button click handlers
  const handleRightClick = useCallback(() => toggleConnectionType('right'), [toggleConnectionType])
  const handleBottomClick = useCallback(
    () => toggleConnectionType('bottom'),
    [toggleConnectionType],
  )
  const handleTopClick = useCallback(() => toggleConnectionType('top'), [toggleConnectionType])

  // Memoize boolean button handlers
  const handleBottomBooleanClick = useCallback(
    () => toggleBoolean('bottomBoolean'),
    [toggleBoolean],
  )
  const handleRightBooleanClick = useCallback(() => toggleBoolean('rightBoolean'), [toggleBoolean])
  const handleLeftBooleanClick = useCallback(() => toggleBoolean('leftBoolean'), [toggleBoolean])

  // Memoize arrows rendering to prevent recalculation
  const arrowsContent = useMemo(() => {
    return isLoaded ? renderArrows() : null
  }, [isLoaded, renderArrows])

  return (
    <div className={'process-task-test-block relative h-full'} ref={ref}>
      <Xwrapper>
        <BlockTaskWrapper>
          <RootTarget id={arrowSetId}>
            <TestShapeWrapper mode={'edit'}>
              <textarea
                className={
                  'textarea-lg flex h-full w-9/12 resize-none items-center justify-center rounded-2xl bg-gray-700/80 p-4 text-center leading-snug focus:outline-none'
                }
                onChange={(e) => handleTextChange(e.target.value)}
                value={localText}
              />
              <ButtonCenterRight onClickFn={handleRightClick} />
              <ButtonBottomCenter onClickFn={handleBottomClick} />
              <ButtonTopCenter onClickFn={handleTopClick} />
              <div className={'absolute -bottom-1/3 left-1/2 z-10 -translate-x-1/2'}>
                <BooleanButton onClick={handleBottomBooleanClick}>
                  <DisplayBoolean booleanOutput={value?.bottomBoolean} />
                </BooleanButton>
              </div>
              <div className={'absolute -right-2 bottom-4 z-10'}>
                <BooleanButton onClick={handleRightBooleanClick}>
                  <DisplayBoolean booleanOutput={value?.rightBoolean} />
                </BooleanButton>
              </div>
              <div className={'absolute -left-2 bottom-4 z-10'}>
                <BooleanButton onClick={handleLeftBooleanClick}>
                  <DisplayBoolean booleanOutput={value?.leftBoolean} />
                </BooleanButton>
              </div>
            </TestShapeWrapper>
          </RootTarget>
          <OuterTargets id={arrowSetId} />
          <div className={'x-arrows'}>{arrowsContent}</div>
        </BlockTaskWrapper>
      </Xwrapper>
    </div>
  )
}
