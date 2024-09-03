'use client';
import { TaskShapeWrapper } from '@/admin/components/graph/wrappers/task-shape-wrapper';
import { BlockTaskWrapper } from '@/admin/components/graph/wrappers/block-task-wrapper';
import { OuterTargets } from '@/admin/components/graph/fields/graph/lib/outer-targets';
import { ButtonCenterRight } from '@/admin/components/graph/fields/graph/components/node-buttons';
import { ConnectionsType, useArrows } from '@/admin/components/graph/fields/graph/hooks/use-arrows';
import { RootTarget } from '@/admin/components/graph/fields/graph/lib/root-target';
import { Xwrapper } from '@/lib/xarrows/src';
import { processTaskParallelConnections } from '@/admin/components/graph/fields/graph/flows/parallel/connection-definitions';
import { useGraphFieldState } from '@/admin/components/graph/fields/graph/hooks/use-graph-field-state';

type ComponentState = {
  connections: ConnectionsType;
  textLeft: string;
  textRight: string;
};

const initialState: ComponentState = {
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
};

export const ProcessTaskParallelField: React.FC = () => {
  const { state, setState } = useGraphFieldState<ComponentState>({
    initialState,
  });

  const { arrowSetId, toggleConnectionType, ref, renderArrows, isLoaded } = useArrows({
    state,
    setState,
    connections: processTaskParallelConnections,
  });

  const setTextLeft = (text: string) => {
    setState({ ...state, textLeft: text });
  };

  const setTextRight = (text: string) => {
    setState({ ...state, textRight: text });
  };

  return (
    <div ref={ref}>
      <Xwrapper>
        <div className={'grid w-full grid-cols-2'}>
          <BlockTaskWrapper>
            <RootTarget id={arrowSetId} comboTarget={'left'}>
              <TaskShapeWrapper mode={'edit'}>
                <textarea
                  className={
                    'textarea-lg flex size-full resize-none items-center justify-center rounded-2xl bg-transparent p-0 text-center leading-snug focus:outline-none'
                  }
                  onChange={(e) => setTextLeft(e.target.value)}
                  value={state.textLeft}
                />
              </TaskShapeWrapper>
            </RootTarget>
          </BlockTaskWrapper>
          <BlockTaskWrapper>
            <RootTarget id={arrowSetId} comboTarget={'right'}>
              <TaskShapeWrapper mode={'edit'}>
                <textarea
                  className={
                    'textarea-lg flex size-full resize-none items-center justify-center rounded-2xl bg-transparent p-0 text-center leading-snug focus:outline-none'
                  }
                  onChange={(e) => setTextRight(e.target.value)}
                  value={state.textRight}
                />
                <ButtonCenterRight onClickFn={() => toggleConnectionType('right')} />
              </TaskShapeWrapper>
            </RootTarget>
            <OuterTargets id={arrowSetId} />
          </BlockTaskWrapper>
        </div>
        <div className={'x-arrows'}>{isLoaded && renderArrows()}</div>
      </Xwrapper>
    </div>
  );
};
