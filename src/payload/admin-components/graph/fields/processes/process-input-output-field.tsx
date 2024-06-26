'use client';
import { useField } from '@payloadcms/ui/forms/useField';
import { ArrowRight } from '@/payload/admin-components/graph/connectors/arrows/arrow-right';
import { LineHorizontal } from '@/payload/admin-components/graph/connectors/line-horizontal';
import { InputOutputWrapper } from '@/payload/admin-components/graph/wrappers/input-output-wrapper';
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider';
import { useEffect, useState } from 'react';
import { ArrowLeft } from '@/payload/admin-components/graph/connectors/arrows/arrow-left';
import { isObject } from 'lodash-es';

type ComponentState = {
  enabled: boolean;
  connections: {
    right: 'out' | 'in';
  };
  text: string;
};

const componentState: ComponentState = {
  enabled: true,
  connections: {
    right: 'out',
  },
  text: '',
};

export const ProcessInputOutputField: React.FC = () => {
  const { path } = useFieldProps();
  const { value, setValue } = useField<string>({ path });

  const [state, setState] = useState<ComponentState>(componentState);

  const setRightConnectionType = (type: 'out' | 'in') => {
    setState({ ...state, connections: { right: type } });
  };

  const toggleRightConnectionType = () => {
    if (state.connections.right === 'in') {
      setRightConnectionType('out');
    } else {
      setRightConnectionType('in');
    }
  };

  const toggleEnabled = () => {
    setState({ ...state, enabled: !state.enabled });
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
  }, [setValue, state, state.text]);

  return (
    <div className={'relative flex flex-col items-center justify-center'}>
      {state.enabled && (
        <div className={'flex h-fit flex-row'}>
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
                'flex flex-row items-center justify-center py-3 hover:cursor-pointer hover:bg-accent'
              }
              onClick={toggleRightConnectionType}>
              {state.connections.right === 'out' && (
                <>
                  <ArrowLeft />
                  <LineHorizontal />
                </>
              )}
              {state.connections.right === 'in' && (
                <>
                  <LineHorizontal />
                  <ArrowRight />
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div className={'absolute -top-2 right-1/2'}>
        <input
          type="checkbox"
          className="toggle"
          checked={state.enabled}
          onChange={toggleEnabled}
        />
      </div>
    </div>
  );
};
