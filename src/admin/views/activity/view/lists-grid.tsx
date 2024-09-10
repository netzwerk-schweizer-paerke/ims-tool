import { TaskList } from '@/types/payload-types';
import { Translate } from '@/lib/translate';
import { ListBlock } from '@/admin/views/activity/view/list-block';

type Props = {
  lists: (number | TaskList)[] | null | undefined;
};

export const ListsGrid: React.FC<Props> = ({ lists }) => {
  if (!lists) {
    throw new Error('FlowsGrid flows prop should not be null or undefined');
  }
  return (
    <div className={'prose prose-lg'}>
      <h3>
        <Translate k={'activityBlock:tasks:title'} />
      </h3>
      <div className={'flex flex-row flex-wrap items-start justify-items-start gap-4'}>
        {lists.map((list, i) => (
          <div key={i} className={'w-48'}>
            <ListBlock list={list} />
          </div>
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
