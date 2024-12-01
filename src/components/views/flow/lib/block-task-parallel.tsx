import { ProcessTaskParallelBlock } from '@/payload-types'
import { BlockWrapper } from '@/components/views/flow/block-wrapper'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { TaskFlowArrows } from '@/components/views/flow/task-flow-arrows'
import { BlockMetadata } from '@/components/views/flow/lib/block-metadata'

type Props = {
  block: ProcessTaskParallelBlock
}

export const BlockTaskParallel: React.FC<Props> = ({ block }) => {
  const graph = block.graph
  const task = graph?.task

  if (!task) {
    throw new Error('FlowBlock proc-task-p block should have a task')
  }

  return (
    <>
      <div className={'flow-block relative grid grid-cols-2 border-b border-b-gray-500'}>
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
  )
}
