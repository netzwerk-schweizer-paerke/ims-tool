import { PayloadLexicalReactRenderer } from '@/lib/lexical-render/src/payloadLexicalReactRenderer'
import { ProcessTaskCompoundBlock } from '@/components/views/flow/flow-block'
import { BlockMetaWrapper } from '@/components/views/flow/lib/block-meta-wrapper'

type Props = {
  block: ProcessTaskCompoundBlock
}

export const BlockMetadata: React.FC<Props> = ({ block }) => {
  return (
    <>
      <BlockMetaWrapper>
        <PayloadLexicalReactRenderer content={block.keypoints?.keypoints as any} />
      </BlockMetaWrapper>
      <BlockMetaWrapper>
        <PayloadLexicalReactRenderer content={block.tools?.tools as any} />
      </BlockMetaWrapper>
      <BlockMetaWrapper>
        <PayloadLexicalReactRenderer content={block.responsibility?.responsibility as any} />
      </BlockMetaWrapper>
    </>
  )
}
