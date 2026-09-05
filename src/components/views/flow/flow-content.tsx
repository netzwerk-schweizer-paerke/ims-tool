import React, { ReactNode } from 'react'

import { LastUpdated } from '@/components/last-updated'
import { FlowBlock } from '@/components/views/flow/flow-block'
import { PayloadLexicalReactRenderer } from '@/lib/lexical-render/src/payload-lexical-react-renderer'
import { Translate } from '@/lib/translate'
import { TaskFlow } from '@/payload-types'

type Props = {
  flowBlock: TaskFlow
  /** The admin view passes the edit and share actions. The public page passes none. */
  toolbar?: ReactNode
}

/** The body of a flow page. The admin view and the public share page both render it. */
export const FlowContent = ({ flowBlock, toolbar }: Props) => {
  const blocks = flowBlock.blocks || []

  return (
    <>
      <div className={'prose prose-lg'}>
        <h1>{flowBlock.name}</h1>
        <h3>
          <Translate k={'flowBlock:title'} />
        </h3>
      </div>
      {/* One gap below the toolbar, stated here. Every view repeats it. */}
      <div className={'mb-16 flex flex-row items-center justify-between gap-4'}>
        <LastUpdated date={flowBlock.updatedAt} />
        {toolbar}
      </div>
      {flowBlock.description && (
        <div className={'mb-8'}>
          <div className={'prose prose-lg py-6 pl-4'}>
            <PayloadLexicalReactRenderer content={flowBlock.description} />
          </div>
        </div>
      )}
      <div>
        <div className={'grid grid-cols-[440px_auto_auto_auto]'}>
          <div></div>
          <div className={'pl-4'}>
            <Translate k={'flowBlock:table:keypoints'} />
          </div>
          <div className={'pl-4'}>
            <Translate k={'flowBlock:table:tools'} />
          </div>
          <div className={'pl-4'}>
            <Translate k={'flowBlock:table:responsibility'} />
          </div>
          {blocks.map((block, i) => (
            <FlowBlock block={block} key={i} />
          ))}
        </div>
        {blocks.length === 0 && (
          <p>
            <Translate k={'common:noContentDefined'} />
          </p>
        )}
      </div>
    </>
  )
}
