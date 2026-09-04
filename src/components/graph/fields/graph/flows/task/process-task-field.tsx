'use client'
import { JSONFieldClientComponent } from 'payload'
import { useCallback } from 'react'

import { GraphTextArea } from '@/components/graph/fields/graph/components/graph-text-area'
import {
  ButtonBottomCenter,
  ButtonCenterRight,
  ButtonTopCenter,
} from '@/components/graph/fields/graph/components/node-buttons'
import { processTaskConnections } from '@/components/graph/fields/graph/flows/task/connection-definitions'
import { useGraphField } from '@/components/graph/fields/graph/hooks/use-graph-field'
import useTextField from '@/components/graph/fields/graph/hooks/use-text-field'
import { ConnectionsType } from '@/components/graph/fields/graph/lib/connection-types'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'

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
  const { arrowsContent, arrowSetId, setValue, toggleConnectionType, value } =
    useGraphField<ComponentState>({
      connections: processTaskConnections,
      createInitialState,
      props,
    })

  const { handleTextChange, localText } = useTextField(value, setValue)

  const handleRightClick = useCallback(() => toggleConnectionType('right'), [toggleConnectionType])
  const handleBottomClick = useCallback(
    () => toggleConnectionType('bottom'),
    [toggleConnectionType],
  )
  const handleTopClick = useCallback(() => toggleConnectionType('top'), [toggleConnectionType])

  return (
    <div className={'process-task-parallel-block relative h-full'}>
      <BlockTaskWrapper>
        <RootTarget id={arrowSetId}>
          <TaskShapeWrapper mode={'edit'}>
            <GraphTextArea
              className={'w-full bg-transparent p-0'}
              onTextChange={handleTextChange}
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
    </div>
  )
}
