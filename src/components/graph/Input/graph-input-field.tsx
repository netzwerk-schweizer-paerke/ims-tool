'use client';
import { useField } from '@payloadcms/ui/forms/useField';
import { ArrowRight } from '@/components/graph/connectors/arrow-right';
import { LineHorizontal } from '@/components/graph/connectors/line-horizontal';
import { InputOutputWrapper } from '@/components/graph/wrappers/input-output-wrapper';
import { logger } from '@/lib/logger';

export const GraphInputField: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path });
  logger.info('GraphInputField', { path, value });
  return (
    <div className={'flex h-fit flex-row'} style={{ paddingRight: 0 }}>
      <InputOutputWrapper>
        <textarea
          className={
            'textarea-lg flex size-full resize-none items-center justify-center text-center focus:outline-none'
          }
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
      </InputOutputWrapper>
      <div className={'flex flex-row items-center justify-center'}>
        <LineHorizontal />
        <ArrowRight />
      </div>
    </div>
  );
};
