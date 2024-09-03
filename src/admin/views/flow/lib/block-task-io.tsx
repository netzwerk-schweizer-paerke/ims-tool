import { ProcessTaskIOBlock } from '@/types/payload-types';
import { BlockWrapper } from '@/admin/views/flow/block-wrapper';
import { IOShapeWrapper } from '@/admin/components/graph/wrappers/i-o-shape-wrapper';
import { TaskShapeWrapper } from '@/admin/components/graph/wrappers/task-shape-wrapper';
import { TaskFlowArrows } from '@/admin/views/flow/task-flow-arrows';
import { BlockMetadata } from '@/admin/views/flow/lib/block-metadata';

type Props = {
  block: ProcessTaskIOBlock;
};

export const BlockTaskIo: React.FC<Props> = ({ block }) => {
  const graph = (block as ProcessTaskIOBlock).graph;
  const task = graph?.task;
  const io = graph?.io;
  const isIoEnabled = io?.enabled;

  if (!task) {
    throw new Error('FlowBlock proc-task-io block should have a task');
  }
  if (!io) {
    throw new Error('FlowBlock proc-task-io block should have an io');
  }

  return (
    <>
      <div className={'flow-block border-base-content/40 relative grid grid-cols-2 border-b'}>
        <div>
          {isIoEnabled && (
            <BlockWrapper id={`${block.id}-left`} position={'left'}>
              <IOShapeWrapper>{io?.text}</IOShapeWrapper>
            </BlockWrapper>
          )}
        </div>
        <div>
          <BlockWrapper id={`${block.id}-right`} position={'right'}>
            <TaskShapeWrapper>{task?.text}</TaskShapeWrapper>
          </BlockWrapper>
        </div>
        <TaskFlowArrows taskFlowBlock={block} />
      </div>
      <BlockMetadata block={block} />
    </>
  );
};
