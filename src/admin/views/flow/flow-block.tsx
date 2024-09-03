import {
  ProcessTaskIOBlock,
  ProcessTaskParallelBlock,
  ProcessTestOutputBlock,
} from '@/types/payload-types';
import { BlockTaskIo } from '@/admin/views/flow/lib/block-task-io';
import { BlockTestOutput } from '@/admin/views/flow/lib/block-test-output';
import { BlockTaskParallel } from '@/admin/views/flow/lib/block-task-parallel';

export type ProcessTaskCompoundBlock =
  | ProcessTaskIOBlock
  | ProcessTestOutputBlock
  | ProcessTaskParallelBlock;

type Props = {
  block?: ProcessTaskCompoundBlock;
};

export const FlowBlock: React.FC<Props> = ({ block }) => {
  if (!block) {
    throw new Error('FlowBlock block prop should not be null or undefined');
  }

  if (block.blockType === 'proc-task-io') {
    return <BlockTaskIo block={block} />;
  }

  if (block.blockType === 'proc-task-p') {
    return <BlockTaskParallel block={block} />;
  }

  if (block.blockType === 'proc-test') {
    return <BlockTestOutput block={block} />;
  }
};
