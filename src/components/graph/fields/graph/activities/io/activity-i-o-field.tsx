'use client'
import { JSONFieldClientComponent } from 'payload'
import { useCallback } from 'react'

import { activityConnections } from '@/components/graph/fields/graph/activities/connection-definitions'
import { GraphTextArea } from '@/components/graph/fields/graph/components/graph-text-area'
import {
  ButtonBottomCenter,
  ButtonCenterRight,
  ButtonTopCenter,
} from '@/components/graph/fields/graph/components/node-buttons'
import { useGraphField } from '@/components/graph/fields/graph/hooks/use-graph-field'
import useTextField from '@/components/graph/fields/graph/hooks/use-text-field'
import { ConnectionsType } from '@/components/graph/fields/graph/lib/connection-types'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import '@/components/graph/fields/graph/lib/arrow-styles.css'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { IOShapeWrapper } from '@/components/graph/wrappers/i-o-shape-wrapper'

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

export const ActivityIOField: JSONFieldClientComponent = (props) => {
  const { arrowsContent, arrowSetId, setValue, toggleConnectionType, value } =
    useGraphField<ComponentState>({
      connections: activityConnections,
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
    <div>
      <BlockTaskWrapper>
        <RootTarget id={arrowSetId}>
          <IOShapeWrapper mode={'edit'}>
            <GraphTextArea
              className={'w-full bg-transparent p-0'}
              onTextChange={handleTextChange}
              value={localText}
            />
            <ButtonCenterRight onClickFn={handleRightClick} />
            <ButtonBottomCenter onClickFn={handleBottomClick} />
            <ButtonTopCenter onClickFn={handleTopClick} />
          </IOShapeWrapper>
        </RootTarget>
        <OuterTargets id={arrowSetId} />
        <div className={'x-arrows'}>{arrowsContent}</div>
      </BlockTaskWrapper>
    </div>
  )
}
