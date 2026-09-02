import { ProcessTaskCompoundBlock } from '@/components/views/flow/flow-block'
import { BlockMetaWrapper } from '@/components/views/flow/lib/block-meta-wrapper'
import { PayloadLexicalReactRenderer } from '@/lib/lexical-render/src/payload-lexical-react-renderer'

type Props = {
  block: ProcessTaskCompoundBlock
}

export const BlockMetadata: React.FC<Props> = ({ block }) => {
  return (
    <>
      <BlockMetaWrapper>
        <PayloadLexicalReactRenderer content={block.keypoints?.keypoints} />
      </BlockMetaWrapper>
      <BlockMetaWrapper>
        <PayloadLexicalReactRenderer content={block.tools?.tools} />
      </BlockMetaWrapper>
      <BlockMetaWrapper>
        <PayloadLexicalReactRenderer content={block.responsibility?.responsibility} />
      </BlockMetaWrapper>
    </>
  )
}
