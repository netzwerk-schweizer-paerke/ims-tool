import { ProcessTestOutputBlock } from '@/payload-types'
import { BlockWrapper } from '@/components/views/flow/block-wrapper'
import { IOShapeWrapper } from '@/components/graph/wrappers/i-o-shape-wrapper'
import { TaskFlowArrows } from '@/components/views/flow/task-flow-arrows'
import { Translate } from '@/lib/translate'
import { TestShapeWrapper } from '@/components/graph/wrappers/test-shape-wrapper'
import { BlockMetadata } from '@/components/views/flow/lib/block-metadata'

type Props = {
  block: ProcessTestOutputBlock
}

export const BlockTestOutput: React.FC<Props> = ({ block }) => {
  const outputBlockText = block.graph?.output?.text
  const testBlockText = block.graph?.test?.text
  const isOutputEnabled = block.graph?.output?.enabled

  const rightBoolean = block.graph?.test?.rightBoolean
  const leftBoolean = block.graph?.test?.leftBoolean
  const bottomBoolean = block.graph?.test?.bottomBoolean

  const getBoolean = (booleanValue: string | undefined) => {
    if (booleanValue === 'none') {
      return ''
    }
    if (booleanValue === 'true') {
      return <Translate k={'common:boolean:true'} />
    }
    if (booleanValue === 'false') {
      return <Translate k={'common:boolean:false'} />
    }
    return ''
  }

  return (
    <>
      <div className={'flow-block relative grid grid-cols-2 border-b border-b-gray-500'}>
        <div>
          {isOutputEnabled && (
            <BlockWrapper id={`${block.id}-left`} position={'left'}>
              <IOShapeWrapper>{outputBlockText}</IOShapeWrapper>
            </BlockWrapper>
          )}
        </div>
        <div>
          <BlockWrapper id={`${block.id}-right`} position={'right'} spacing={'auto'}>
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
      <BlockMetadata block={block} />
    </>
  )
}
