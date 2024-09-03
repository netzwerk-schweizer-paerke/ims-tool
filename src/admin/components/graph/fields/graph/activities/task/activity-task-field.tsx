'use client';
import { TaskShapeWrapper } from '@/admin/components/graph/wrappers/task-shape-wrapper';
import { BlockTaskWrapper } from '@/admin/components/graph/wrappers/block-task-wrapper';
import { OuterTargets } from '@/admin/components/graph/fields/graph/lib/outer-targets';
import {
  ButtonBottomCenter,
  ButtonCenterRight,
  ButtonTopCenter,
} from '@/admin/components/graph/fields/graph/components/node-buttons';
import { activityTaskConnections } from './connection-definitions';
import { ConnectionsType, useArrows } from '@/admin/components/graph/fields/graph/hooks/use-arrows';
import { RootTarget } from '@/admin/components/graph/fields/graph/lib/root-target';

import '@/admin/components/graph/fields/graph/lib/arrow-styles.css';
import { Xwrapper } from '@/lib/xarrows/src';
import { useGraphFieldState } from '@/admin/components/graph/fields/graph/hooks/use-graph-field-state';

type ComponentState = {
  connections: ConnectionsType;
  text: string;
};

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
};

export const ActivityTaskField: React.FC = () => {
  const { setText, state, setState } = useGraphFieldState<ComponentState>({
    initialState,
  });

  const { arrowSetId, toggleConnectionType, ref, renderArrows, isLoaded } = useArrows({
    state,
    setState,
    connections: activityTaskConnections,
  });

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
  );
};
