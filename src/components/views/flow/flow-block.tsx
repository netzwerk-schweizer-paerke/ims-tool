import { BlockTaskIo } from '@/components/views/flow/lib/block-task-io'
import { BlockTaskParallel } from '@/components/views/flow/lib/block-task-parallel'
import { BlockTestOutput } from '@/components/views/flow/lib/block-test-output'
import {
  ProcessTaskIOBlock,
  ProcessTaskParallelBlock,
  ProcessTestOutputBlock,
} from '@/payload-types'

export type ProcessTaskCompoundBlock =
  ProcessTaskIOBlock | ProcessTaskParallelBlock | ProcessTestOutputBlock

type Props = {
  block?: ProcessTaskCompoundBlock
}

export const FlowBlock: React.FC<Props> = ({ block }) => {
  if (!block) {
    return null
  }

  if (block.blockType === 'proc-task-io') {
    return <BlockTaskIo block={block} />
  }

  if (block.blockType === 'proc-task-p') {
    return <BlockTaskParallel block={block} />
  }

  if (block.blockType === 'proc-test') {
    return <BlockTestOutput block={block} />
  }

  // A block type this view does not render yet
  return null
}
