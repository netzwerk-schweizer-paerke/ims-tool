'use client'
import { GraphLabel } from '@/components/graph/graph-label'
import { IOShapeWrapper } from '@/components/graph/wrappers/i-o-shape-wrapper'
import { TaskShapeWrapper } from '@/components/graph/wrappers/task-shape-wrapper'
import { BlockWrapper } from '@/components/views/flow/block-wrapper'
import { BlockMetadata } from '@/components/views/flow/lib/block-metadata'
import { TaskFlowArrows } from '@/components/views/flow/task-flow-arrows'
import { Xwrapper } from '@/lib/xarrows/src'
import { ProcessTaskIOBlock } from '@/payload-types'

type Props = {
  block: ProcessTaskIOBlock
}

export const BlockTaskIo: React.FC<Props> = ({ block }) => {
  const graph = (block as ProcessTaskIOBlock).graph
  const task = graph?.task
  const io = graph?.io
  const isIoEnabled = io?.enabled

  // A block saved before the graph field existed has no task/io JSON. The markup below
  // already optional-chains both, so render the block empty rather than blanking the view.

  return (
    <Xwrapper>
      <div className={'flow-block relative grid grid-cols-2 border-b border-b-gray-500'}>
        <div>
          {isIoEnabled && (
            <BlockWrapper id={`${block.id}-left`}>
              <IOShapeWrapper>
                <GraphLabel>{io?.text}</GraphLabel>
              </IOShapeWrapper>
            </BlockWrapper>
          )}
        </div>
        <div>
          <BlockWrapper id={`${block.id}-right`}>
            <TaskShapeWrapper>
              <GraphLabel>{task?.text}</GraphLabel>
            </TaskShapeWrapper>
          </BlockWrapper>
        </div>
        <TaskFlowArrows taskFlowBlock={block} />
      </div>
      <BlockMetadata block={block} />
    </Xwrapper>
  )
}
