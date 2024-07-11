import { IOShapeWrapper } from '@/admin-components/graph/wrappers/i-o-shape-wrapper';
import { ProcessTaskIOBlock, ProcessTestOutputBlock } from '@/types/payload-types';
import { TaskShapeWrapper } from '@/admin-components/graph/wrappers/task-shape-wrapper';
import { TestShapeWrapper } from '@/admin-components/graph/wrappers/test-shape-wrapper';
import { PayloadLexicalReactRenderer } from '@/lib/lexical-render/src/payloadLexicalReactRenderer';
import { BlockWrapper } from '@/admin-components/flow/block-wrapper';
import { TaskFlowArrows } from '@/admin-components/flow/task-flow-arrows';
import { Translate } from '@/lib/translate';

export type ProcessTaskCompoundBlock = ProcessTaskIOBlock | ProcessTestOutputBlock;

type Props = {
  block?: ProcessTaskCompoundBlock;
};

export const FlowBlock: React.FC<Props> = ({ block }) => {
  if (!block) {
    throw new Error('FlowBlock block prop should not be null or undefined');
  }

  if (block.blockType === 'proc-task-io') {
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
        <div className={'flow-block relative grid size-full grid-cols-2 border-b'}>
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
        <div className={'prose prose-lg border-b py-6 pl-4'}>
          <PayloadLexicalReactRenderer content={block.keypoints?.keypoints as any} />
        </div>
        <div className={'prose prose-lg border-b py-6 pl-4'}>
          <PayloadLexicalReactRenderer content={block.tools?.tools as any} />
        </div>
        <div className={'prose prose-lg border-b py-6 pl-4'}>
          <PayloadLexicalReactRenderer content={block.responsibility?.responsibility as any} />
        </div>
      </>
    );
  }

  if (block.blockType === 'proc-test') {
    const outputBlockText = block.graph?.output?.text;
    const testBlockText = block.graph?.test?.text;
    const isOutputEnabled = block.graph?.output?.enabled;

    const rightBoolean = block.graph?.test?.rightBoolean;
    const leftBoolean = block.graph?.test?.leftBoolean;
    const bottomBoolean = block.graph?.test?.bottomBoolean;

    const getBoolean = (booleanValue: string | undefined) => {
      if (booleanValue === 'none') {
        return '';
      }
      if (booleanValue === 'true') {
        return <Translate k={'common:boolean:true'} />;
      }
      if (booleanValue === 'false') {
        return <Translate k={'common:boolean:false'} />;
      }
      return '';
    };

    return (
      <>
        <div className={'flow-block relative grid size-full grid-cols-2 border-b'}>
          <div>
            {isOutputEnabled && (
              <BlockWrapper id={`${block.id}-left`} position={'left'}>
                <IOShapeWrapper>{outputBlockText}</IOShapeWrapper>
              </BlockWrapper>
            )}
          </div>
          <div>
            <BlockWrapper id={`${block.id}-right`} position={'right'}>
              <TestShapeWrapper>{testBlockText}</TestShapeWrapper>
              {rightBoolean && rightBoolean !== 'none' && (
                <div className={'absolute right-0'}>{getBoolean(rightBoolean)}</div>
              )}
              {leftBoolean && leftBoolean !== 'none' && (
                <div className={'absolute left-0'}>{getBoolean(leftBoolean)}</div>
              )}
              {bottomBoolean && bottomBoolean !== 'none' && (
                <div className={'absolute bottom-0'}>{getBoolean(bottomBoolean)}</div>
              )}
            </BlockWrapper>
          </div>
          <TaskFlowArrows taskFlowBlock={block} />
        </div>
        <div className={'prose prose-lg border-b py-6'}>
          <PayloadLexicalReactRenderer content={block.keypoints?.keypoints as any} />
        </div>
        <div className={'prose prose-lg border-b py-6'}>
          <PayloadLexicalReactRenderer content={block.tools?.tools as any} />
        </div>
        <div className={'prose prose-lg border-b py-6'}>
          <PayloadLexicalReactRenderer content={block.responsibility?.responsibility as any} />
        </div>
      </>
    );
  }
};
