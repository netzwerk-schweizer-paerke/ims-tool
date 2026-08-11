'use client'
import { JSONFieldClientComponent } from 'payload'
import { useCallback } from 'react'

import { activityConnections } from '@/components/graph/fields/graph/activities/connection-definitions'
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

export const ActivityTaskField: JSONFieldClientComponent = (props) => {
  const { arrowsContent, arrowSetId, ref, setValue, toggleConnectionType, value } =
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
