'use client';
import { useField } from '@payloadcms/ui/forms/useField';
import { LineVertical } from '@/components/graph/connectors/line-vertical';
import { ArrowDown } from '@/components/graph/connectors/arrow-down';
import { TaskWrapper } from '@/components/graph/wrappers/task-wrapper';
import { logger } from '@/lib/logger';

export const GraphTaskField: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path });
  logger.info('GraphTaskField', { path, value });
  return (
    <div className={'flex flex-col'} style={{ paddingLeft: 0 }}>
      <TaskWrapper>
        <textarea
          className={
            'textarea-lg flex size-full resize-none items-center justify-center text-center focus:outline-none'
          }
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
      </TaskWrapper>
      <div className={'flex grow flex-col items-center justify-center'}>
        <LineVertical />
        <ArrowDown />
      </div>
    </div>
  );
};
