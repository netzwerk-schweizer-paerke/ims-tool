import { ConnectionStateType } from '@/components/graph/fields/graph/hooks/use-arrows'
import { IOShapeWrapper } from '@/components/graph/wrappers/i-o-shape-wrapper'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { ActivityBlockViewLink } from '@/components/views/activity/overview/activity/activity-block-view-link'
import { BlockWrapper } from '@/components/views/activity/overview/activity/block-wrapper'
import { Translate } from '@/lib/translate'
import { ActivityIOBlock, ActivityTaskBlock } from '@/payload-types'

export type ActivityTaskCompoundBlock = (ActivityIOBlock | ActivityTaskBlock) & {
  graph?: { task?: ConnectionStateType }
  id: string
}

type Props = {
  activityId: number
  block?: ActivityIOBlock | ActivityTaskBlock
  type: 'empty' | 'input' | 'output' | 'task'
}

export const ActivityBlock: React.FC<Props> = ({ activityId, block, type }) => {
  if (!block || type === 'empty') {
    return <div className="activity-block"></div>
  }

  const blockText = (block as ActivityTaskCompoundBlock).graph?.task?.text || (
    <Translate k={'activityLandscape:blockHasNoName'} />
  )

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
  )
}
