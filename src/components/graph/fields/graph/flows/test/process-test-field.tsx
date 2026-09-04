'use client'
import { JSONFieldClientComponent } from 'payload'
import { memo, useCallback } from 'react'

import { BooleanButton } from '@/components/graph/fields/graph/components/boolean-button'
import { GraphTextArea } from '@/components/graph/fields/graph/components/graph-text-area'
import {
  ButtonBottomCenter,
  ButtonCenterRight,
  ButtonTopCenter,
} from '@/components/graph/fields/graph/components/node-buttons'
import { processTestConnections } from '@/components/graph/fields/graph/flows/test/connection-definitions'
import { useGraphField } from '@/components/graph/fields/graph/hooks/use-graph-field'
import useTextField from '@/components/graph/fields/graph/hooks/use-text-field'
import { ConnectionsType } from '@/components/graph/fields/graph/lib/connection-types'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { TestShapeWrapper } from '@/components/graph/wrappers/test-shape-wrapper'

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

const createInitialState = (): ComponentState => ({
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
})

const booleanOutputMap = {
  [BooleanOutput.FALSE]: 'False',
  [BooleanOutput.None]: 'None',
  [BooleanOutput.TRUE]: 'True',
}

const booleanOutputCssMap = {
  [BooleanOutput.FALSE]: 'text-red-600',
  [BooleanOutput.None]: '',
  [BooleanOutput.TRUE]: 'text-green-600',
}

const DisplayBoolean = memo(({ booleanOutput }: { booleanOutput: BooleanOutput }) => {
  return (
    <div className={`text-center text-sm font-bold ${booleanOutputCssMap[booleanOutput]}`}>
      {booleanOutputMap[booleanOutput]}
    </div>
  )
})

DisplayBoolean.displayName = 'DisplayBoolean'

export const ProcessTestField: JSONFieldClientComponent = (props) => {
  const { arrowsContent, arrowSetId, setValue, toggleConnectionType, value } =
    useGraphField<ComponentState>({
      connections: processTestConnections,
      createInitialState,
      props,
    })

  const { handleTextChange, localText } = useTextField(value, setValue)

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

  const handleRightClick = useCallback(() => toggleConnectionType('right'), [toggleConnectionType])
  const handleBottomClick = useCallback(
    () => toggleConnectionType('bottom'),
    [toggleConnectionType],
  )
  const handleTopClick = useCallback(() => toggleConnectionType('top'), [toggleConnectionType])

  const handleBottomBooleanClick = useCallback(
    () => toggleBoolean('bottomBoolean'),
    [toggleBoolean],
  )
  const handleRightBooleanClick = useCallback(() => toggleBoolean('rightBoolean'), [toggleBoolean])
  const handleLeftBooleanClick = useCallback(() => toggleBoolean('leftBoolean'), [toggleBoolean])

  return (
    <div className={'process-task-test-block relative h-full'}>
      <BlockTaskWrapper>
        <RootTarget id={arrowSetId}>
          <TestShapeWrapper mode={'edit'}>
            <GraphTextArea
              className={'w-10/12 bg-gray-700/80 p-4'}
              onTextChange={handleTextChange}
              value={localText}
            />
            <ButtonCenterRight onClickFn={handleRightClick} />
            <ButtonBottomCenter onClickFn={handleBottomClick} />
            <ButtonTopCenter onClickFn={handleTopClick} />
            <div className={'absolute -bottom-1/3 left-1/2 z-10 -translate-x-1/2'}>
              <BooleanButton onClick={handleBottomBooleanClick}>
                <DisplayBoolean booleanOutput={value?.bottomBoolean ?? BooleanOutput.None} />
              </BooleanButton>
            </div>
            <div className={'absolute -right-2 bottom-4 z-10'}>
              <BooleanButton onClick={handleRightBooleanClick}>
                <DisplayBoolean booleanOutput={value?.rightBoolean ?? BooleanOutput.None} />
              </BooleanButton>
            </div>
            <div className={'absolute -left-2 bottom-4 z-10'}>
              <BooleanButton onClick={handleLeftBooleanClick}>
                <DisplayBoolean booleanOutput={value?.leftBoolean ?? BooleanOutput.None} />
              </BooleanButton>
            </div>
          </TestShapeWrapper>
        </RootTarget>
        <OuterTargets id={arrowSetId} />
        <div className={'x-arrows'}>{arrowsContent}</div>
      </BlockTaskWrapper>
    </div>
  )
}
