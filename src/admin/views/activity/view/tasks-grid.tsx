import { FlowBlock } from '@/admin/views/activity/view/flow-block';
import { TaskFlow, TaskList } from '@/types/payload-types';
import { ListBlock } from '@/admin/views/activity/view/list-block';

type Props = {
  tasks:
    | (
        | { relationTo: 'task-flows'; value: number | TaskFlow }
        | { relationTo: 'task-lists'; value: number | TaskList }
      )[]
    | null
    | undefined;
};

export const TasksGrid: React.FC<Props> = ({ tasks }) => {
  if (!tasks) {
    throw new Error('TasksGrid flows prop should not be null or undefined');
  }
  return (
    <>
      {tasks.map((task, i) => {
        switch (task.relationTo) {
          case 'task-flows': {
            return (
              <div key={i} className={'w-48'}>
                <FlowBlock flow={task.value} />
              </div>
            );
          }
          case 'task-lists': {
            return (
              <div key={i} className={'w-48'}>
                <ListBlock list={task.value} />
              </div>
            );
          }
        }
      })}
    </>
  );
};
