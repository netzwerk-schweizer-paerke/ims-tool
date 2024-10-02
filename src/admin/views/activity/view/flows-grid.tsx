import { FlowBlock } from '@/admin/views/activity/view/flow-block';
import { TaskFlow } from '@/types/payload-types';

type Props = {
  flows: (number | TaskFlow)[] | null | undefined;
};

export const FlowsGrid: React.FC<Props> = ({ flows }) => {
  if (!flows) {
    throw new Error('FlowsGrid flows prop should not be null or undefined');
  }
  return (
    <>
      {flows.map((flow, i) => (
        <div key={i} className={'w-48'}>
          <FlowBlock flow={flow} />
        </div>
      ))}
    </>
  );
};
