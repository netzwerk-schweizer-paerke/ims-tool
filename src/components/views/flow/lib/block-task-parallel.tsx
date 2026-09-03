'use client'
import { GraphLabel } from '@/components/graph/graph-label'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { BlockWrapper } from '@/components/views/flow/block-wrapper'
import { BlockMetadata } from '@/components/views/flow/lib/block-metadata'
import { TaskFlowArrows } from '@/components/views/flow/task-flow-arrows'
import { ProcessTaskParallelBlock } from '@/payload-types'

type Props = {
  block: ProcessTaskParallelBlock
}

export const BlockTaskParallel: React.FC<Props> = ({ block }) => {
  const graph = block.graph
  const task = graph?.task

  // A block saved before the graph field existed has no task JSON. The markup below already
  // optional-chains it, so render the block empty rather than blanking the view.

  return (
    <>
      <div className={'flow-block relative grid grid-cols-2 border-b border-b-gray-500'}>
        <div>
          <BlockWrapper id={`${block.id}-left`}>
            <TaskShapeWrapper>
              <GraphLabel>{task?.textLeft}</GraphLabel>
            </TaskShapeWrapper>
          </BlockWrapper>
        </div>
        <div>
          <BlockWrapper id={`${block.id}-right`}>
            <TaskShapeWrapper>
              <GraphLabel>{task?.textRight}</GraphLabel>
            </TaskShapeWrapper>
          </BlockWrapper>
        </div>
        <TaskFlowArrows taskFlowBlock={block} />
      </div>
      <BlockMetadata block={block} />
    </>
  )
}
