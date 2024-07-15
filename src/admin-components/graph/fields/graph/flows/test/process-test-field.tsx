'use client';
import { useField, useFieldProps } from '@payloadcms/ui';
import { useEffect, useState } from 'react';
import { isObject } from 'lodash-es';
import { BlockTaskWrapper } from '@/admin-components/graph/wrappers/block-task-wrapper';
import { OuterTargets } from '@/admin-components/graph/fields/graph/lib/outer-targets';
import {
  ButtonBottomCenter,
  ButtonCenterRight,
  ButtonTopCenter,
} from '@/admin-components/graph/fields/graph/lib/buttons';
import { ConnectionsType, useArrows } from '@/admin-components/graph/fields/graph/hooks/use-arrows';
import { RootTarget } from '@/admin-components/graph/fields/graph/lib/root-target';
import { processTestConnections } from '@/admin-components/graph/fields/graph/flows/test/connection-definitions';
import { TestShapeWrapper } from '@/admin-components/graph/wrappers/test-shape-wrapper';
import { Xwrapper } from '@/lib/xarrows/src';

enum BooleanOutput {
  FALSE = 'false',
  TRUE = 'true',
  None = 'none',
}

type ComponentState = {
  connections: ConnectionsType;
  text: string;
  leftBoolean: BooleanOutput;
  bottomBoolean: BooleanOutput;
  rightBoolean: BooleanOutput;
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
  leftBoolean: BooleanOutput.FALSE,
  bottomBoolean: BooleanOutput.TRUE,
  rightBoolean: BooleanOutput.None,
};

const DisplayBoolean: React.FC<{ booleanOutput: BooleanOutput }> = ({ booleanOutput }) => {
  const booleanOutputMap = {
    [BooleanOutput.FALSE]: 'False',
    [BooleanOutput.TRUE]: 'True',
    [BooleanOutput.None]: 'None',
  };

  const booleanOutputCssMap = {
    [BooleanOutput.FALSE]: 'text-red-600',
    [BooleanOutput.TRUE]: 'text-green-600',
    [BooleanOutput.None]: '',
  };

  return (
    <div className={`text-center text-sm font-bold ${booleanOutputCssMap[booleanOutput]}`}>
      {booleanOutputMap[booleanOutput]}
    </div>
  );
};

export const ProcessTestField: React.FC = () => {
  const { path } = useFieldProps();
  const { value, setValue } = useField<string>({ path });
  const [state, setState] = useState<ComponentState>(componentState);

  const { arrowSetId, toggleConnectionType, ref, renderArrows, isLoaded } = useArrows({
    state,
    setState,
    connections: processTestConnections,
  });

  const setText = (text: string) => {
    setState({ ...state, text });
  };

  const toggleBoolean = (position: 'leftBoolean' | 'bottomBoolean' | 'rightBoolean') => {
    const currentBoolean = state[position];
    let newBoolean = BooleanOutput.None;
    if (currentBoolean === BooleanOutput.None) {
      newBoolean = BooleanOutput.FALSE;
    } else if (currentBoolean === BooleanOutput.FALSE) {
      newBoolean = BooleanOutput.TRUE;
    }
    setState({ ...state, [position]: newBoolean });
  };

  useEffect(() => {
    if (!value) return;
    if (isObject(value)) {
      setState(value as unknown as ComponentState);
    }
    console.log(value);
  }, []);

  useEffect(() => {
    setValue(state);
  }, [setValue, state, state.text, state.connections]);

  return (
    <div ref={ref}>
      <Xwrapper>
        <BlockTaskWrapper>
          <RootTarget id={arrowSetId}>
            <TestShapeWrapper mode={'edit'}>
              <textarea
                className={
                  'textarea-lg flex size-full resize-none items-center justify-center rounded-2xl bg-transparent p-10 text-center leading-snug focus:outline-none'
                }
                onChange={(e) => setText(e.target.value)}
                value={state.text}
              />
              <ButtonCenterRight onClickFn={() => toggleConnectionType('right')} />
              <ButtonBottomCenter onClickFn={() => toggleConnectionType('bottom')} />
              <ButtonTopCenter onClickFn={() => toggleConnectionType('top')} />
              <button
                type={'button'}
                className={'btn bottom-boolean btn-ghost btn-sm absolute -bottom-1/3 left-1/2 z-10'}
                onClick={() => toggleBoolean('bottomBoolean')}>
                <DisplayBoolean booleanOutput={state.bottomBoolean} />
              </button>
              <button
                type={'button'}
                className={'btn right-boolean btn-ghost btn-sm absolute -right-2 bottom-1/2 z-10'}
                onClick={() => toggleBoolean('rightBoolean')}>
                <DisplayBoolean booleanOutput={state.rightBoolean} />
              </button>
              <button
                type={'button'}
                className={'btn left-boolean btn-ghost btn-sm absolute -left-2 bottom-1/2 z-10'}
                onClick={() => toggleBoolean('leftBoolean')}>
                <DisplayBoolean booleanOutput={state.leftBoolean} />
              </button>
            </TestShapeWrapper>
          </RootTarget>
          <OuterTargets id={arrowSetId} />
          <div className={'x-arrows'}>{isLoaded && renderArrows()}</div>
        </BlockTaskWrapper>
      </Xwrapper>
    </div>
  );
};
