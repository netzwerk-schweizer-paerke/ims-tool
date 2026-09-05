import React, { ReactNode } from 'react'

import { LastUpdated } from '@/components/last-updated'
import { TasksGrid } from '@/components/views/activity/view/tasks-grid'
import { ViewLinks } from '@/components/views/view-links'
import { PayloadLexicalReactRenderer } from '@/lib/lexical-render/src/payload-lexical-react-renderer'
import { Translate } from '@/lib/translate'
import { Activity } from '@/payload-types'
import { ActivityBlock } from '@/payload/utilities/share/load-activity-block'

import './landscape-bg.css'

type Props = {
  activity: Activity
  activityBlock: ActivityBlock | undefined
  links: ViewLinks
  /** The admin view passes the edit and share actions. The public page passes none. */
  toolbar?: ReactNode
}

const findTitle = (activity: Activity, block: ActivityBlock | undefined) =>
  block?.graph?.task?.text || activity.name

/** The body of an activity block page. The admin view and the public share page both render it. */
export const ActivityBlockContent = ({ activity, activityBlock, links, toolbar }: Props) => (
  <>
    <div className={'prose lg:prose-lg'}>
      <h1>{findTitle(activity, activityBlock)}</h1>
      <h3>
        <Translate k={'activityBlock:title'} />
      </h3>
    </div>
    <div className={'mb-8 flex flex-row items-center justify-between gap-4'}>
      <LastUpdated date={activity.updatedAt} />
      {toolbar}
    </div>
    <div className={'grid grid-cols-[28%_auto_28%]'}>
      {activityBlock ? (
        <>
          <div className={'grid grid-cols-[auto_48px]'}>
            <div className={'landscape-bg prose prose-lg pb-4 pl-4 pr-4 pt-2'}>
              <h3>
                <Translate k={'activityBlock:input:title'} />
              </h3>
              {activityBlock.io?.input ? (
                <PayloadLexicalReactRenderer content={activityBlock.io.input} />
              ) : (
                <p>
                  <Translate k={'common:noContentDefined'} />
                </p>
              )}
            </div>
            <div className={'landscape-bg-arrow-right'}></div>
          </div>
          <div className={'grid grid-cols-[auto_48px]'}>
            <div className={'landscape-bg relative p-4'}>
              <div className={'prose prose-lg flex flex-col gap-16'}>
                {/* `grid-auto-rows: 1fr` gives every row the height of the tallest card, so
                    all cards match across rows. A flex wrap equalises within one row only.
                    The track is 13rem because every shape wrapper sets `min-w-52`. A narrower
                    track makes the card overflow into the gutter, and the gap disappears. */}
                <div
                  className={
                    'grid grid-cols-[repeat(auto-fill,13rem)] gap-4 leading-[normal] [grid-auto-rows:1fr]'
                  }>
                  <TasksGrid links={links} tasks={activityBlock?.relations?.tasks} />
                </div>
              </div>
            </div>
            <div className={'landscape-bg-arrow-right'}></div>
          </div>
          <div className={'landscape-bg relative pb-4 pl-4 pr-4 pt-2'}>
            <div className={'prose prose-lg'}>
              <h3>
                <Translate k={'activityBlock:output:title'} />
              </h3>
              {activityBlock.io?.output ? (
                <PayloadLexicalReactRenderer content={activityBlock.io.output} />
              ) : (
                <p>
                  <Translate k={'common:noContentDefined'} />
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div>
          <Translate k={'common:noContentDefined'} />
        </div>
      )}
    </div>
    <div className={'mt-16 grid grid-cols-2 gap-8'}>
      <div className={'prose prose-lg'}>
        <h3>
          <Translate k={'activityBlock:infos:norms'} />
        </h3>
        {activityBlock?.infos?.norms ? (
          <PayloadLexicalReactRenderer content={activityBlock.infos.norms} />
        ) : (
          <p>
            <Translate k={'common:noContentDefined'} />
          </p>
        )}
      </div>
      <div className={'prose prose-lg'}>
        <h3>
          <Translate k={'activityBlock:infos:support'} />
        </h3>
        {activityBlock?.infos?.support ? (
          <PayloadLexicalReactRenderer content={activityBlock.infos.support} />
        ) : (
          <p>
            <Translate k={'common:noContentDefined'} />
          </p>
        )}
      </div>
    </div>
  </>
)
