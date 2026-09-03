import { DefaultTemplate } from '@payloadcms/next/templates'
import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import { AdminViewServerProps } from 'payload'
import React from 'react'

import { DragScrollWrapper } from '@/components/drag-scroll-wrapper'
import { StepNav } from '@/components/step-nav'
import { ActivityFlow } from '@/components/views/activity/overview/activity/activity-flow'
import { ActivityStrategy } from '@/components/views/activity/overview/activity/activity-strategy'
import { ActivitySupport } from '@/components/views/activity/overview/activity/activity-support'
import { ActivityTitles } from '@/components/views/activity/overview/activity/activity-titles'
import { getDefaultLocaleCode, toContentLocale } from '@/lib/locale-utils'
import { requireAuthenticatedUser } from '@/lib/require-authenticated-user'
import { Translate } from '@/lib/translate'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

import './landscape-bg.css'

export const ActivitiesView: React.FC<AdminViewServerProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const headers = await getHeaders()
  const { req } = initPageResult

  requireAuthenticatedUser({ initPageResult, params, searchParams })

  const { user } = await req.payload.auth({ headers })
  // `i18n.fallbackLanguage` is the admin language, which is a different axis and includes `en`.
  // A query needs the content locale, so narrow it and let Payload default when it is absent.
  const locale = toContentLocale(req.locale, req.payload.config)
  const localeCode = locale ?? getDefaultLocaleCode(req.payload.config)

  const selectedOrganisationId = getIdFromRelation(user?.selectedOrganisation)

  // A null id queries `organisation IS NULL` and returns the rows that belong to no
  // organisation. The user has selected none, so the view has nothing to show.
  const activities = selectedOrganisationId
    ? await req.payload
        .find({
          collection: 'activities',
          depth: 2,
          locale,
          sort: 'docOrder',
          where: {
            organisation: {
              equals: selectedOrganisationId,
            },
          },
        })
        .then((res) => res.docs)
    : []

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
          <DragScrollWrapper direction={'horizontal'} scrollSpeed={2} showScrollbar={true}>
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
                          <ActivityStrategy activity={activity} key={activity.id} locale={localeCode} />
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
                      className={'mt-2 grid grow grid-rows-[min-content,auto] gap-4'}
                      style={{
                        gridTemplateColumns: `repeat(${standardActivities.length || 1}, minmax(185px, 1fr))`,
                      }}>
                      <div className={'col-span-full grid grid-cols-subgrid'}>
                        {standardActivities.map((activity) => (
                          <ActivityTitles activity={activity} key={activity.id} locale={localeCode} />
                        ))}
                      </div>
                      <div className={'col-span-full grid grid-cols-subgrid'}>
                        {standardActivities.map((activity) => (
                          <ActivityFlow activity={activity} key={activity.id} locale={localeCode} />
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
                  <ActivitySupport activity={activity} key={activity.id} locale={localeCode} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DefaultTemplate>
  )
}
