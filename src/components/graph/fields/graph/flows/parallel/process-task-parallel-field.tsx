'use client'
import { JSONFieldClientComponent } from 'payload'
import { useCallback } from 'react'

import { GraphTextArea } from '@/components/graph/fields/graph/components/graph-text-area'
import { ButtonCenterRight } from '@/components/graph/fields/graph/components/node-buttons'
import { processTaskParallelConnections } from '@/components/graph/fields/graph/flows/parallel/connection-definitions'
import { useGraphField } from '@/components/graph/fields/graph/hooks/use-graph-field'
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
  const { arrowsContent, arrowSetId, ref, setValue, toggleConnectionType, value } =
    useGraphField<ComponentState>({
      connections: processTaskParallelConnections,
      createInitialState,
      props,
    })

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

  const handleRightClick = useCallback(() => toggleConnectionType('right'), [toggleConnectionType])

  return (
    <div className={'process-task-parallel-block relative h-full'} ref={ref}>
      <Xwrapper>
        <div className={'grid size-full grid-cols-2'}>
          <BlockTaskWrapper>
            <RootTarget comboTarget={'left'} id={arrowSetId}>
              <TaskShapeWrapper mode={'edit'}>
                <GraphTextArea
                  className={'w-full bg-transparent p-0'}
                  onTextChange={handleTextLeftChange}
                  value={localTextLeft}
                />
              </TaskShapeWrapper>
            </RootTarget>
          </BlockTaskWrapper>
          <BlockTaskWrapper>
            <RootTarget comboTarget={'right'} id={arrowSetId}>
              <TaskShapeWrapper mode={'edit'}>
                <GraphTextArea
                  className={'w-full bg-transparent p-0'}
                  onTextChange={handleTextRightChange}
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
