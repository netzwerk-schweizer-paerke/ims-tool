import { FlowBlock } from '@/admin-components/activity/view/flow-block';
import { TaskList } from '@/types/payload-types';
import { Translate } from '@/lib/translate';

type Props = {
  activityId: number;
  lists: (number | TaskList)[] | null | undefined;
};

export const ListsGrid: React.FC<Props> = ({ lists, activityId }) => {
  if (!lists) {
    throw new Error('FlowsGrid flows prop should not be null or undefined');
  }
  return (
    <div className={'prose prose-lg'}>
      <h3>
        <Translate k={'activityBlock:tasks:title'} />
      </h3>
      <div className={'grid grid-cols-4'}>
        {lists.map((flow, i) => (
          <FlowBlock key={i} activityId={activityId} flow={flow} />
        ))}
        {lists.length < 1 && (
          <div className={'col-span-4'}>
            <Translate k={'activityBlock:tasks:noTasks'} />
          </div>
        )}
      </div>
    </div>
  );
};
