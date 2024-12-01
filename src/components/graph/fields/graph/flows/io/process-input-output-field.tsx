'use client'
import { IOShapeWrapper } from '@/components/graph/wrappers/i-o-shape-wrapper'
import { BlockTaskWrapper } from '@/components/graph/wrappers/block-task-wrapper'
import { ConnectionsType, useArrows } from '@/components/graph/fields/graph/hooks/use-arrows'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTarget } from '@/components/graph/fields/graph/lib/root-target'
import { ButtonCenterRight } from '@/components/graph/fields/graph/components/node-buttons'
import { processIoConnections } from '@/components/graph/fields/graph/flows/io/connection-definitions'
import { Xwrapper } from '@/lib/xarrows/src'
import { useGraphFieldState } from '@/components/graph/fields/graph/hooks/use-graph-field-state'
import { ToggleSwitch } from '@/components/graph/fields/graph/lib/toggle-switch'
import { JSONFieldClientProps } from 'payload'

type ComponentState = {
  enabled: boolean
  connections: ConnectionsType
  text: string
}

const initialState: ComponentState = {
  enabled: true,
  connections: [
    {
      position: 'right',
      type: 'out',
    },
  ],
  text: '',
}

export const ProcessInputOutputField: React.FC<JSONFieldClientProps> = ({ path }) => {
  const { setText, state, setState } = useGraphFieldState<ComponentState>({
    initialState,
    path,
  })

  const { arrowSetId, toggleConnectionType, ref, renderArrows, isLoaded } = useArrows({
    state,
    setState,
    connections: processIoConnections,
  })

  const toggleEnabled = () => {
    setState({ ...state, enabled: !state.enabled })
  }

  return (
    <div ref={ref}>
      <Xwrapper>
        <BlockTaskWrapper>
          {state.enabled && (
            <>
              <RootTarget id={arrowSetId}>
                <IOShapeWrapper mode={'edit'}>
                  <textarea
                    className={
                      'textarea-lg flex size-full resize-none items-center justify-center rounded-2xl bg-transparent p-0 text-center leading-snug focus:outline-none'
                    }
                    onChange={(e) => setText(e.target.value)}
                    value={state.text}
                  />
                  <ButtonCenterRight onClickFn={() => toggleConnectionType('right')} />
                </IOShapeWrapper>
              </RootTarget>
              <OuterTargets id={arrowSetId} />
              <div className={'x-arrows'}>{isLoaded && renderArrows()}</div>
            </>
          )}
          <div className={'absolute right-1/2 top-0 translate-x-1/2'}>
            <ToggleSwitch checked={state.enabled} onChange={toggleEnabled} />
          </div>
        </BlockTaskWrapper>
      </Xwrapper>
    </div>
  )
}
