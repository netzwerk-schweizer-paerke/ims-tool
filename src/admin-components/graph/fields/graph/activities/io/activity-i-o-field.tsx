'use client';
import { useField, useFieldProps } from '@payloadcms/ui';

import { useEffect, useState } from 'react';
import { isObject } from 'lodash-es';
import { BlockTaskWrapper } from '@/admin-components/graph/wrappers/block-task-wrapper';
import { Xwrapper } from 'react-xarrows-updated';
import { OuterTargets } from '@/admin-components/graph/fields/graph/lib/outer-targets';
import {
  ButtonBottomCenter,
  ButtonCenterRight,
  ButtonTopCenter,
} from '@/admin-components/graph/fields/graph/lib/buttons';
import { activityIOFieldConnections } from './connection-definitions';
import { ConnectionsType, useArrows } from '@/admin-components/graph/fields/graph/hooks/use-arrows';
import { RootTarget } from '@/admin-components/graph/fields/graph/lib/root-target';
import { IOShapeWrapper } from '@/admin-components/graph/wrappers/i-o-shape-wrapper';
import { deepEqual } from '@hapi/hoek';

import '../../lib/arrow-styles.css';

type ComponentState = {
  connections: ConnectionsType;
  text: string;
};

const componentState: ComponentState = {
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

export const ActivityIOField: React.FC = () => {
  const { path } = useFieldProps();
  const { value, setValue } = useField<string>({ path });
  const [state, setState] = useState<ComponentState>(componentState);

  const { arrowSetId, toggleConnectionType, ref, renderArrows, isLoaded } = useArrows({
    state,
    setState,
    connections: activityIOFieldConnections,
  });

  const setText = (text: string) => {
    setState({ ...state, text });
  };

  useEffect(() => {
    if (!value) return;
    if (isObject(value)) {
      setState(value as unknown as ComponentState);
    }
  }, []);

  useEffect(() => {
    if (deepEqual(state, value)) return;
    setValue(state);
  }, [setValue, state, state.text, state.connections, value]);

  return (
    <div ref={ref}>
      <Xwrapper>
        <BlockTaskWrapper>
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
              <ButtonBottomCenter onClickFn={() => toggleConnectionType('bottom')} />
              <ButtonTopCenter onClickFn={() => toggleConnectionType('top')} />
            </IOShapeWrapper>
          </RootTarget>
          <OuterTargets id={arrowSetId} />
          <div className={'x-arrows'}>{isLoaded && renderArrows()}</div>
        </BlockTaskWrapper>
      </Xwrapper>
    </div>
  );
};
