import { ProcessTaskParallelBlock } from '@/types/payload-types';
import { BlockWrapper } from '@/admin-components/flow/block-wrapper';
import { TaskShapeWrapper } from '@/admin-components/graph/wrappers/task-shape-wrapper';
import { TaskFlowArrows } from '@/admin-components/flow/task-flow-arrows';
import { BlockMetadata } from '@/admin-components/flow/lib/block-metadata';

type Props = {
  block: ProcessTaskParallelBlock;
};

export const BlockTaskParallel: React.FC<Props> = ({ block }) => {
  const graph = block.graph;
  const task = graph?.task;
  console.log('task', task);

  if (!task) {
    throw new Error('FlowBlock proc-task-p block should have a task');
  }

  return (
    <>
      <div className={'flow-block border-base-content/40 relative grid grid-cols-2 border-b'}>
        <div>
          <BlockWrapper id={`${block.id}-left`} position={'right'}>
            <TaskShapeWrapper>{task?.textLeft}</TaskShapeWrapper>
          </BlockWrapper>
        </div>
        <div>
          <BlockWrapper id={`${block.id}-right`} position={'right'}>
            <TaskShapeWrapper>{task?.textRight}</TaskShapeWrapper>
          </BlockWrapper>
        </div>
        <TaskFlowArrows taskFlowBlock={block} />
      </div>
      <BlockMetadata block={block} />
    </>
  );
};
