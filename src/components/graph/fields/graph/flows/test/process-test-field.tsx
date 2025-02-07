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
import { useCallback } from 'react'
import { useField } from '@payloadcms/ui'

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

const DisplayBoolean: React.FC<{ booleanOutput: BooleanOutput }> = ({ booleanOutput }) => {
  const booleanOutputMap = {
    [BooleanOutput.FALSE]: 'False',
    [BooleanOutput.TRUE]: 'True',
    [BooleanOutput.None]: 'None',
  }

  const booleanOutputCssMap = {
    [BooleanOutput.FALSE]: 'text-red-600',
    [BooleanOutput.TRUE]: 'text-green-600',
    [BooleanOutput.None]: '',
  }

  return (
    <div className={`text-center text-sm font-bold ${booleanOutputCssMap[booleanOutput]}`}>
      {booleanOutputMap[booleanOutput]}
    </div>
  )
}

export const ProcessTestField: JSONFieldClientComponent = (props) => {
  const {
    path,
    validate,
    field: { required },
  } = props

  const memoizedValidate: any = useCallback(
    (value: any, options: any) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { value, setValue } = useField<ComponentState>({ path, validate: memoizedValidate })
  const state = value ? value : initialState

  const setText = (text: string) => {
    setValue({ ...value, text })
  }

  const { arrowSetId, toggleConnectionType, ref, renderArrows, isLoaded } = useArrows({
    state,
    setState: setValue,
    connections: processTestConnections,
  })

  const toggleBoolean = (position: 'leftBoolean' | 'bottomBoolean' | 'rightBoolean') => {
    const currentBoolean = state[position]
    let newBoolean = BooleanOutput.None
    if (currentBoolean === BooleanOutput.None) {
      newBoolean = BooleanOutput.FALSE
    } else if (currentBoolean === BooleanOutput.FALSE) {
      newBoolean = BooleanOutput.TRUE
    }
    setValue({ ...state, [position]: newBoolean })
  }

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
                onChange={(e) => setText(e.target.value)}
                value={state.text}
              />
              <ButtonCenterRight onClickFn={() => toggleConnectionType('right')} />
              <ButtonBottomCenter onClickFn={() => toggleConnectionType('bottom')} />
              <ButtonTopCenter onClickFn={() => toggleConnectionType('top')} />
              <div className={'absolute -bottom-1/3 left-1/2 z-10 -translate-x-1/2'}>
                <BooleanButton onClick={() => toggleBoolean('bottomBoolean')}>
                  <DisplayBoolean booleanOutput={state.bottomBoolean} />
                </BooleanButton>
              </div>
              <div className={'absolute -right-2 bottom-4 z-10'}>
                <BooleanButton onClick={() => toggleBoolean('rightBoolean')}>
                  <DisplayBoolean booleanOutput={state.rightBoolean} />
                </BooleanButton>
              </div>
              <div className={'absolute -left-2 bottom-4 z-10'}>
                <BooleanButton onClick={() => toggleBoolean('leftBoolean')}>
                  <DisplayBoolean booleanOutput={state.leftBoolean} />
                </BooleanButton>
              </div>
            </TestShapeWrapper>
          </RootTarget>
          <OuterTargets id={arrowSetId} />
          <div className={'x-arrows'}>{isLoaded && renderArrows()}</div>
        </BlockTaskWrapper>
      </Xwrapper>
    </div>
  )
}
