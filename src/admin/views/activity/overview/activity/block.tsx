import { IOShapeWrapper } from '@/admin/components/graph/wrappers/i-o-shape-wrapper';
import { TaskShapeWrapper } from '@/admin/components/graph/wrappers/task-shape-wrapper';
import { ConnectionStateType } from '@/admin/components/graph/fields/graph/hooks/use-arrows';
import { BlockWrapper } from '@/admin/views/activity/overview/activity/block-wrapper';
import { ActivityBlockViewLink } from '@/admin/views/activity/overview/activity/activity-block-view-link';
import { ActivityIOBlock, ActivityTaskBlock } from '@/types/payload-types';
import { Translate } from '@/lib/translate';

export type ActivityTaskCompoundBlock = (ActivityIOBlock | ActivityTaskBlock) & {
  graph?: { task?: ConnectionStateType };
  id: string;
};

type Props = {
  activityId: number;
  block?: ActivityIOBlock | ActivityTaskBlock;
  type: 'input' | 'output' | 'task' | 'empty';
};

export const ActivityBlock: React.FC<Props> = ({ block, activityId, type }) => {
  if (!block || type === 'empty') {
    return <div className="activity-block"></div>;
  }

  const blockText = (block as ActivityTaskCompoundBlock).graph?.task?.text! || (
    <Translate k={'activityLandscape:blockHasNoName'} />
  );

  return (
    <>
      {type === 'input' && (
        <BlockWrapper id={block.id}>
          <IOShapeWrapper>
            <ActivityBlockViewLink activityId={activityId} blockId={block.id}>
              {blockText}
            </ActivityBlockViewLink>
          </IOShapeWrapper>
        </BlockWrapper>
      )}
      {type === 'output' && (
        <BlockWrapper id={block.id}>
          <IOShapeWrapper>
            <ActivityBlockViewLink activityId={activityId} blockId={block.id}>
              {blockText}
            </ActivityBlockViewLink>
          </IOShapeWrapper>
        </BlockWrapper>
      )}
      {type === 'task' && (
        <BlockWrapper id={block.id}>
          <TaskShapeWrapper>
            <ActivityBlockViewLink activityId={activityId} blockId={block.id}>
              {blockText}
            </ActivityBlockViewLink>
          </TaskShapeWrapper>
        </BlockWrapper>
      )}
    </>
  );
};
