'use client';
import { useField } from '@payloadcms/ui/forms/useField';
import { LineVertical } from '../../connectors/line-vertical';
import { ArrowDown } from '@/payload/admin-components/graph/connectors/arrows/arrow-down';
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider';
import { useEffect, useState } from 'react';
import { isObject } from 'lodash-es';
import { ConnectionRightInBottom } from '@/payload/admin-components/graph/connectors/connection-right-in-bottom';
import { ConnectionRightInTop } from '@/payload/admin-components/graph/connectors/connection-right-in-top';
import { ConnectionRightInPassBy } from '@/payload/admin-components/graph/connectors/connection-right-in-pass-by';
import { ConnectionRightOutTop } from '@/payload/admin-components/graph/connectors/connection-right-out-top';
import { ConnectionRightOutBottom } from '@/payload/admin-components/graph/connectors/connection-right-out-bottom';
import { ConnectionRightOutPassBy } from '@/payload/admin-components/graph/connectors/connection-right-out-pass-by';
import { ConnectionRightPassBy } from '@/payload/admin-components/graph/connectors/connection-right-pass-by';
import { InputOutputWrapper } from '@/payload/admin-components/graph/wrappers/input-output-wrapper';

type PossibleConnectionRight =
  | 'in-top'
  | 'in-bottom'
  | 'in-pass-by'
  | 'pass-by'
  | 'out-top'
  | 'out-bottom'
  | 'out-pass-by'
  | 'none';
const possibleConnectionRightTypes: PossibleConnectionRight[] = [
  'in-top',
  'in-bottom',
  'in-pass-by',
  'out-top',
  'out-bottom',
  'out-pass-by',
  'pass-by',
  'none',
];

type ComponentState = {
  connections: {
    top: 'in' | 'none';
    right: PossibleConnectionRight;
    bottom: 'out' | 'none';
  };
  text: string;
};

const componentState: ComponentState = {
  connections: {
    top: 'none',
    right: 'none',
    bottom: 'out',
  },
  text: '',
};

export const ActivityIOField: React.FC = () => {
  const { path } = useFieldProps();
  const { value, setValue } = useField<string>({ path });

  const [state, setState] = useState<ComponentState>(componentState);

  const setTopConnectionType = (type: 'in' | 'none') => {
    setState({ ...state, connections: { ...state.connections, top: type } });
  };

  const toggleTopConnectionType = () => {
    if (state.connections.top === 'in') {
      setTopConnectionType('none');
    } else {
      setTopConnectionType('in');
    }
  };

  const setRightConnectionType = (type: PossibleConnectionRight) => {
    setState({ ...state, connections: { ...state.connections, right: type } });
  };

  const toggleRightConnectionType = () => {
    const currentIndex = possibleConnectionRightTypes.indexOf(state.connections.right);
    if (currentIndex === -1) {
      setRightConnectionType(possibleConnectionRightTypes[0]);
      return;
    }
    const nextIndex = currentIndex + 1;
    if (!possibleConnectionRightTypes[nextIndex]) {
      setRightConnectionType(possibleConnectionRightTypes[0]);
    } else {
      setRightConnectionType(possibleConnectionRightTypes[nextIndex]);
    }
  };

  const setBottomConnectionType = (type: 'out' | 'none') => {
    setState({ ...state, connections: { ...state.connections, bottom: type } });
  };

  const toggleBottomConnectionType = () => {
    if (state.connections.bottom === 'out') {
      setBottomConnectionType('none');
    } else {
      setBottomConnectionType('out');
    }
  };

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
    setValue(state);
  }, [setValue, state, state.text, state.connections]);

  return (
    <div className={'flex h-full flex-col items-center justify-center'}>
      <div className={'flex h-full flex-row'}>
        <div className={'flex grow flex-col items-center justify-center'}>
          <div className={'flex flex-row items-center justify-center'}>
            <div
              className={
                'flex h-12 flex-col items-center justify-center px-3 hover:cursor-pointer hover:bg-accent'
              }
              onClick={toggleTopConnectionType}>
              {state.connections.top === 'in' && (
                <>
                  <LineVertical />
                  <ArrowDown />
                </>
              )}
              {state.connections.top === 'none' && (
                <>
                  <div>&nbsp;</div>
                </>
              )}
            </div>
          </div>
          <InputOutputWrapper>
            <textarea
              className={
                'textarea-lg flex size-full resize-none items-center justify-center text-center focus:outline-none'
              }
              onChange={(e) => setText(e.target.value)}
              value={state.text}
            />
          </InputOutputWrapper>
          <div className={'flex flex-row items-center justify-center'}>
            <div
              className={
                'flex h-12 flex-col items-center justify-center px-3 hover:cursor-pointer hover:bg-accent'
              }
              onClick={toggleBottomConnectionType}>
              {state.connections.bottom === 'out' && (
                <>
                  <LineVertical />
                  <ArrowDown />
                </>
              )}
              {state.connections.bottom === 'none' && (
                <>
                  <div>&nbsp;</div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className={'flex h-full flex-row items-center justify-center'}>
          <div
            className={
              'flex h-full w-12 flex-row items-center justify-center py-3 hover:cursor-pointer hover:bg-accent'
            }
            onClick={toggleRightConnectionType}>
            {state.connections.right === 'in-top' && (
              <>
                <ConnectionRightInTop />
              </>
            )}
            {state.connections.right === 'in-bottom' && (
              <>
                <ConnectionRightInBottom />
              </>
            )}
            {state.connections.right === 'in-pass-by' && (
              <>
                <ConnectionRightInPassBy />
              </>
            )}
            {state.connections.right === 'out-top' && (
              <>
                <ConnectionRightOutTop />
              </>
            )}
            {state.connections.right === 'out-bottom' && (
              <>
                <ConnectionRightOutBottom />
              </>
            )}
            {state.connections.right === 'out-pass-by' && (
              <>
                <ConnectionRightOutPassBy />
              </>
            )}
            {state.connections.right === 'pass-by' && (
              <>
                <ConnectionRightPassBy />
              </>
            )}
            {state.connections.right === 'none' && (
              <>
                <div>&nbsp;</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
