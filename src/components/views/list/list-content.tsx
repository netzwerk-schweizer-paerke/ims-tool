import React, { ReactNode } from 'react'

import { LastUpdated } from '@/components/last-updated'
import { BlockMetaWrapper } from '@/components/views/flow/lib/block-meta-wrapper'
import { PayloadLexicalReactRenderer } from '@/lib/lexical-render/src/payload-lexical-react-renderer'
import { Translate } from '@/lib/translate'
import { TaskList } from '@/payload-types'

type Props = {
  listBlock: TaskList
  /** The admin view passes the edit and share actions. The public page passes none. */
  toolbar?: ReactNode
}

/** The body of a list page. The admin view and the public share page both render it. */
export const ListContent = ({ listBlock, toolbar }: Props) => {
  const blocks = listBlock.items || []

  return (
    <>
      <div className={'prose prose-lg'}>
        <h1>{listBlock.name}</h1>
        <h3>
          <Translate k={'listBlock:title'} />
        </h3>
      </div>
      {/* One gap below the toolbar, stated here. Every view repeats it. */}
      <div className={'mb-16 flex flex-row items-center justify-between gap-4'}>
        <LastUpdated date={listBlock.updatedAt} />
        {toolbar}
      </div>
      {listBlock.description && (
        <div className={'mb-8'}>
          <div className={'prose prose-lg py-6 pl-4'}>
            <PayloadLexicalReactRenderer content={listBlock.description} />
          </div>
        </div>
      )}
      <div>
        <div className={'grid grid-cols-3'}>
          <div className={'pl-4'}>
            <Translate k={'listBlock:table:keypoints'} />
          </div>
          <div className={'pl-4'}>
            <Translate k={'listBlock:table:tools'} />
          </div>
          <div className={'pl-4'}>
            <Translate k={'listBlock:table:responsibility'} />
          </div>
          {blocks.map((block, i) => (
            <React.Fragment key={i}>
              <BlockMetaWrapper>
                <PayloadLexicalReactRenderer content={block.topic} />
              </BlockMetaWrapper>
              <BlockMetaWrapper>
                <PayloadLexicalReactRenderer content={block.tools} />
              </BlockMetaWrapper>
              <BlockMetaWrapper>
                <PayloadLexicalReactRenderer content={block.responsibility} />
              </BlockMetaWrapper>
            </React.Fragment>
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
