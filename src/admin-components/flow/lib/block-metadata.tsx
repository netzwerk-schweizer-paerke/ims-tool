import { PayloadLexicalReactRenderer } from '@/lib/lexical-render/src/payloadLexicalReactRenderer';
import { ProcessTaskCompoundBlock } from '@/admin-components/flow/flow-block';

type Props = {
  block: ProcessTaskCompoundBlock;
};

export const BlockMetadata: React.FC<Props> = ({ block }) => {
  return (
    <>
      <div className={'prose prose-lg border-b border-base-content/40 py-6 pl-4'}>
        <PayloadLexicalReactRenderer content={block.keypoints?.keypoints as any} />
      </div>
      <div className={'prose prose-lg border-b border-base-content/40 py-6 pl-4'}>
        <PayloadLexicalReactRenderer content={block.tools?.tools as any} />
      </div>
      <div className={'prose prose-lg border-b border-base-content/40 py-6 pl-4'}>
        <PayloadLexicalReactRenderer content={block.responsibility?.responsibility as any} />
      </div>
    </>
  );
};
