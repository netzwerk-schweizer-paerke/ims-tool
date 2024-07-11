import { FlowBlock } from '@/admin-components/activity/view/flow-block';
import { TaskFlow } from '@/types/payload-types';
import { Translate } from '@/lib/translate';

type Props = {
  activityId: number;
  flows: (number | TaskFlow)[] | null | undefined;
};

export const FlowsGrid: React.FC<Props> = ({ flows, activityId }) => {
  if (!flows) {
    throw new Error('FlowsGrid flows prop should not be null or undefined');
  }
  if (flows.length === 0) {
    throw new Error('FlowsGrid flows prop should not be empty');
  }
  return (
    <div className={'prose prose-lg'}>
      <h3>
        <Translate k={'activityBlock:flows:title'} />
      </h3>
      <div className={'grid grid-cols-4'}>
        {flows.map((flow, i) => (
          <FlowBlock key={i} activityId={activityId} flow={flow} />
        ))}
      </div>
    </div>
  );
};
