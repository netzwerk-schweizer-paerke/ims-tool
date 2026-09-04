import React, { ReactNode } from 'react'

import { DragScrollWrapper } from '@/components/drag-scroll-wrapper'
import { ActivityFlow } from '@/components/views/activity/overview/activity/activity-flow'
import { ActivityStrategy } from '@/components/views/activity/overview/activity/activity-strategy'
import { ActivitySupport } from '@/components/views/activity/overview/activity/activity-support'
import { ActivityTitles } from '@/components/views/activity/overview/activity/activity-titles'
import { ViewLinks } from '@/components/views/view-links'
import { Translate } from '@/lib/translate'
import { LoadedLandscape } from '@/payload/utilities/share/load-landscape'

import './landscape-bg.css'

type Props = {
  /** The admin view offers a create link on an empty park. The public page offers none. */
  emptyAction?: ReactNode
  landscape: LoadedLandscape
  links: ViewLinks
  locale: string
  /** The admin view passes the edit and share actions. The public page passes none. */
  toolbar?: ReactNode
}

/** The body of the process landscape. The admin view and the public share page both render it. */
export const OverviewContent = ({ emptyAction, landscape, links, locale, toolbar }: Props) => {
  const { standardActivities, strategicActivities, supportActivities } = landscape
  const isEmpty =
    standardActivities.length === 0 &&
    strategicActivities.length === 0 &&
    supportActivities.length === 0

  return (
    <div className={''}>
      {/* The gap below the toolbar is the same on every view. See `flow-content.tsx`. */}
      {toolbar && <div className={'mb-8 flex flex-row justify-end'}>{toolbar}</div>}
      <div className={'relative z-10'}>
        <DragScrollWrapper direction={'horizontal'} scrollSpeed={2} showScrollbar={true}>
          <div className="flex select-none flex-row items-stretch justify-stretch gap-8">
            {isEmpty ? (
              <div>
                <Translate k={'activityLandscape:noContent'} />
                {emptyAction}
              </div>
            ) : (
              <>
                {strategicActivities.length > 0 ? (
                  <div className={'flex shrink flex-row items-stretch justify-stretch'}>
                    <div className={'landscape-bg flex flex-row items-stretch justify-stretch pt-2'}>
                      {strategicActivities.map((activity) => (
                        <ActivityStrategy activity={activity} key={activity.id} links={links} locale={locale} />
                      ))}
                    </div>
                    <div className={'landscape-bg-arrow-right w-12'}></div>
                  </div>
                ) : (
                  <div>
                    <Translate k={'activityLandscape:noBlocks'} />
                  </div>
                )}
                {standardActivities.length > 0 ? (
                  <div
                    className={'mt-2 grid grow grid-rows-[min-content,auto] gap-4'}
                    style={{
                      gridTemplateColumns: `repeat(${standardActivities.length || 1}, minmax(185px, 1fr))`,
                    }}>
                    <div className={'col-span-full grid grid-cols-subgrid'}>
                      {standardActivities.map((activity) => (
                        <ActivityTitles activity={activity} key={activity.id} links={links} locale={locale} />
                      ))}
                    </div>
                    <div className={'col-span-full grid grid-cols-subgrid'}>
                      {standardActivities.map((activity) => (
                        <ActivityFlow activity={activity} key={activity.id} links={links} locale={locale} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Translate k={'activityLandscape:noBlocks'} />
                  </div>
                )}
              </>
            )}
          </div>
        </DragScrollWrapper>
        {supportActivities.length > 0 && (
          <div className={'mt-12 flex flex-col items-stretch justify-stretch'}>
            <div className={'landscape-bg-arrow-top h-12'}></div>
            <div className={'landscape-bg flex flex-row items-stretch justify-stretch pt-2'}>
              {supportActivities.map((activity) => (
                <ActivitySupport activity={activity} key={activity.id} links={links} locale={locale} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
