import React from 'react'
import { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { headers as getHeaders } from 'next/headers'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { ActivityFlow } from '@/components/views/activity/overview/activity/activity-flow'
import { ActivitySupport } from '@/components/views/activity/overview/activity/activity-support'
import { ActivityStrategy } from '@/components/views/activity/overview/activity/activity-strategy'
import { Translate } from '@/lib/translate'
import Link from 'next/link'
import { ActivityTitles } from '@/components/views/activity/overview/activity/activity-titles'
import { StepNav } from '@/components/step-nav'
import { DragScrollWrapper } from '@/components/drag-scroll-wrapper'
import './landscape-bg.css'

export const ActivitiesView: React.FC<AdminViewServerProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const headers = await getHeaders()
  const { req } = initPageResult
  const { user } = await req.payload.auth({ headers })
  const locale = req.locale || req.payload.config.i18n.fallbackLanguage

  const selectedOrganisationId = getIdFromRelation(user?.selectedOrganisation)

  const activities = await req.payload
    .find({
      collection: 'activities',
      locale: locale as any,
      depth: 2,
      where: {
        organisation: {
          equals: selectedOrganisationId,
        },
      },
      sort: 'docOrder',
    })
    .then((res) => {
      if (res.docs.length === 0) {
        return []
      }
      return res.docs
    })

  const strategicActivity =
    activities?.filter((activity) => activity.variant === 'strategyActivity') || []
  const supportActivities =
    activities?.filter((activity) => activity.variant === 'supportActivity') || []
  const standardActivities = activities?.filter((activity) => activity.variant === 'standard') || []

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}>
      <StepNav home={true} />
      <div className={''}>
        <div
          className={'relative z-10'}
          style={{
            marginTop: 'calc(var(--base) * 2)',
            paddingLeft: 'var(--gutter-h)',
            paddingRight: 'var(--gutter-h)',
          }}>
          <DragScrollWrapper scrollSpeed={2} showScrollbar={true} direction={'horizontal'}>
            <div className="flex select-none flex-row items-stretch justify-stretch gap-8">
              {activities.length === 0 ? (
                <div>
                  <Translate k={'activityLandscape:noContent'} />
                  <Link href={'/admin/collections/activities/create'}>
                    <Translate k={'common:continue'} />
                  </Link>
                </div>
              ) : (
                <>
                  {strategicActivity ? (
                    <div className={'flex shrink flex-row items-stretch justify-stretch'}>
                      <div
                        className={'landscape-bg flex flex-row items-stretch justify-stretch pt-2'}>
                        {strategicActivity.map((activity) => (
                          <ActivityStrategy key={activity.id} activity={activity} locale={locale} />
                        ))}
                      </div>
                      <div className={'landscape-bg-arrow-right w-12'}></div>
                    </div>
                  ) : (
                    <div>
                      <Translate k={'activityLandscape:noBlocks'} />
                    </div>
                  )}
                  {standardActivities ? (
                    <div
                      style={{
                        gridTemplateColumns: `repeat(${standardActivities.length || 1}, minmax(185px, 1fr))`,
                      }}
                      className={'mt-2 grid grow grid-rows-[min-content,auto] gap-4'}>
                      <div className={'col-span-full grid grid-cols-subgrid'}>
                        {standardActivities.map((activity) => (
                          <ActivityTitles key={activity.id} activity={activity} locale={locale} />
                        ))}
                      </div>
                      <div className={'col-span-full grid grid-cols-subgrid'}>
                        {standardActivities.map((activity) => (
                          <ActivityFlow key={activity.id} activity={activity} locale={locale} />
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
                  <ActivitySupport key={activity.id} activity={activity} locale={locale} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DefaultTemplate>
  )
}
