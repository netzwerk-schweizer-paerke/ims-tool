'use client'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import {
  ButtonBottomCenter,
  ButtonCenterRight,
  ButtonTopCenter,
} from '@/components/graph/fields/graph/components/node-buttons'
import { ConnectionsType, useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { processTestConnections } from '@/components/graph/fields/graph/flows/test/connection-definitions'
import { TestShapeWrapper } from '@/components/graph/wrappers/test-shape-wrapper'
import { Xwrapper } from '@/lib/xarrows/src'
import { BooleanButton } from '@/components/graph/fields/graph/components/boolean-button'
import { JSONFieldClientComponent } from 'payload'
import { memo, useCallback, useEffect, useMemo } from 'react'
import { useField } from '@payloadcms/ui'
import useTextField from '@/components/graph/fields/graph/hooks/use-text-field'

enum BooleanOutput {
  FALSE = 'false',
  TRUE = 'true',
  None = 'none',
}

type ComponentState = {
  connections: ConnectionsType
  text: string
  leftBoolean: BooleanOutput
  bottomBoolean: BooleanOutput
  rightBoolean: BooleanOutput
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
  leftBoolean: BooleanOutput.FALSE,
  bottomBoolean: BooleanOutput.TRUE,
  rightBoolean: BooleanOutput.None,
}

const DisplayBoolean: React.FC<{ booleanOutput: BooleanOutput }> = memo(({ booleanOutput }) => {
  const booleanOutputMap = useMemo(
    () => ({
      [BooleanOutput.FALSE]: 'False',
      [BooleanOutput.TRUE]: 'True',
      [BooleanOutput.None]: 'None',
    }),
    [],
  )

  const booleanOutputCssMap = useMemo(
    () => ({
      [BooleanOutput.FALSE]: 'text-red-600',
      [BooleanOutput.TRUE]: 'text-green-600',
      [BooleanOutput.None]: '',
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

  // Initialize state only once
  useEffect(() => {
    if (!value) {
      setValue(initialState)
    }
  }, [setValue, value])

  // Memoize arrow hook to prevent recreation
  const { arrowSetId, toggleConnectionType, ref, renderArrows, isLoaded } = useArrows({
    state: value,
    setState: setValue,
    connections: processTestConnections,
  })

  // Memoize toggleBoolean handler
  const toggleBoolean = useCallback(
    (position: 'leftBoolean' | 'bottomBoolean' | 'rightBoolean') => {
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
    <div ref={ref} className={'process-task-test-block relative h-full'}>
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
