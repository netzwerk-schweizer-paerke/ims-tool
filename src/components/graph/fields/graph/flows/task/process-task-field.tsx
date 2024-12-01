'use client'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import {
  ButtonBottomCenter,
  ButtonCenterRight,
  ButtonTopCenter,
} from '@/components/graph/fields/graph/components/node-buttons'
import { processTaskConnections } from '@/components/graph/fields/graph/flows/task/connection-definitions'
import { ConnectionsType, useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { Xwrapper } from '@/lib/xarrows/src'
import { useGraphFieldState } from '@/components/graph/fields/graph/hooks/use-graph-field-state'
import { JSONFieldClientProps } from 'payload'

type ComponentState = {
  connections: ConnectionsType
  text: string
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
}

export const ProcessTaskField: React.FC<JSONFieldClientProps> = ({ path }) => {
  const { setText, state, setState } = useGraphFieldState<ComponentState>({
    initialState,
    path,
  })

  const { arrowSetId, toggleConnectionType, ref, renderArrows, isLoaded } = useArrows({
    state,
    setState,
    connections: processTaskConnections,
  })

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
                onChange={(e) => setText(e.target.value)}
                value={state.text}
              />
              <ButtonCenterRight onClickFn={() => toggleConnectionType('right')} />
              <ButtonBottomCenter onClickFn={() => toggleConnectionType('bottom')} />
              <ButtonTopCenter onClickFn={() => toggleConnectionType('top')} />
            </TaskShapeWrapper>
          </RootTarget>
          <OuterTargets id={arrowSetId} />
          <div className={'x-arrows'}>{isLoaded && renderArrows()}</div>
        </BlockTaskWrapper>
      </Xwrapper>
    </div>
  )
}
