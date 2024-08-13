import { FlowBlock } from '@/admin-components/activity/view/flow-block';
import { TaskFlow } from '@/types/payload-types';
import { Translate } from '@/lib/translate';

type Props = {
  flows: (number | TaskFlow)[] | null | undefined;
};

export const FlowsGrid: React.FC<Props> = ({ flows }) => {
  if (!flows) {
    throw new Error('FlowsGrid flows prop should not be null or undefined');
  }
  return (
    <div className={'prose prose-lg'}>
      <h3>
        <Translate k={'activityBlock:flows:title'} />
      </h3>
      <div className={'grid grid-cols-4 gap-4'}>
        {flows.map((flow, i) => (
          <FlowBlock key={i} flow={flow} />
        ))}
        {flows.length < 1 && (
          <div className={'col-span-4'}>
            <Translate k={'activityBlock:flows:noFlows'} />
          </div>
        )}
      </div>
    </div>
  );
};
