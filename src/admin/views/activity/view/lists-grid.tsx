import { TaskList } from '@/types/payload-types';
import { ListBlock } from '@/admin/views/activity/view/list-block';

type Props = {
  lists: (number | TaskList)[] | null | undefined;
};

export const ListsGrid: React.FC<Props> = ({ lists }) => {
  if (!lists) {
    throw new Error('TasksGrid flows prop should not be null or undefined');
  }
  return (
    <>
      {lists.map((list, i) => (
        <div key={i} className={'w-48'}>
          <ListBlock list={list} />
        </div>
      ))}
    </>
  );
};
