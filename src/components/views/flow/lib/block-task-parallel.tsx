'use client'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { BlockWrapper } from '@/components/views/flow/block-wrapper'
import { BlockMetadata } from '@/components/views/flow/lib/block-metadata'
import { TaskFlowArrows } from '@/components/views/flow/task-flow-arrows'
import { Xwrapper } from '@/lib/xarrows/src'
import { ProcessTaskParallelBlock } from '@/payload-types'

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
    <Xwrapper>
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
    </Xwrapper>
  )
}
