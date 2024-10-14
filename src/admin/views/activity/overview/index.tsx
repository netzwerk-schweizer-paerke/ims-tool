import React from 'react';
import { AdminViewProps } from 'payload';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { headers as getHeaders } from 'next/headers';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';
import { ActivityFlow } from '@/admin/views/activity/overview/activity/activity-flow';
import { ActivitySupport } from '@/admin/views/activity/overview/activity/activity-support';
import { ActivityStrategy } from '@/admin/views/activity/overview/activity/activity-strategy';
import { Translate } from '@/lib/translate';
import Link from 'next/link';
import { ActivityTitles } from '@/admin/views/activity/overview/activity/activity-titles';
import { StepNav } from '@/admin/components/step-nav';
import './landscape-bg.css';

export const ActivitiesView: React.FC<AdminViewProps> = async ({ initPageResult }) => {
  const headers = await getHeaders();
  const { permissions, req } = initPageResult;
  const { user } = await req.payload.auth({ headers });
  const locale = req.locale || req.payload.config.i18n.fallbackLanguage;

  const selectedOrganisationId = getIdFromRelation(user?.selectedOrganisation);

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
        return null;
      }
      return res.docs;
    });

  const strategicActivity = activities?.filter(
    (activity) => activity.variant === 'strategyActivity',
  );
  const supportActivities = activities?.filter(
    (activity) => activity.variant === 'supportActivity',
  );
  const standardActivities = activities?.filter((activity) => activity.variant === 'standard');

  return (
    <DefaultTemplate
      i18n={req.i18n}
      payload={req.payload}
      visibleEntities={initPageResult.visibleEntities}>
      <StepNav home={true} />
      <div className={'w-full overflow-x-auto overflow-y-hidden'}>
        <div
          className={'relative z-10'}
          style={{
            marginTop: 'calc(var(--base) * 2)',
            paddingLeft: 'var(--gutter-h)',
            paddingRight: 'var(--gutter-h)',
          }}>
          <div className={'flex flex-row items-stretch justify-stretch'}>
            {!activities || activities?.length === 0 ? (
              <div>
                <Translate k={'activityLandscape:noContent'} />{' '}
                <Link href={'/admin/collections/activities/create'}>
                  <Translate k={'common:continue'} />
                </Link>
              </div>
            ) : (
              <>
                {strategicActivity ? (
                  <div className={'flex flex-row items-stretch justify-stretch'}>
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
                  <div className={'flex flex-col items-stretch justify-stretch pt-2'}>
                    <div className={'flex flex-row justify-evenly'}>
                      {standardActivities.map((activity) => (
                        <ActivityTitles key={activity.id} activity={activity} locale={locale} />
                      ))}
                    </div>
                    <div className={'flex flex-row items-stretch justify-stretch'}>
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
                {supportActivities ? (
                  <div className={'flex flex-row items-stretch justify-stretch'}>
                    <div className={'landscape-bg-arrow-left w-12'}></div>
                    <div
                      className={'landscape-bg flex flex-row items-stretch justify-stretch pt-2'}>
                      {supportActivities.map((activity) => (
                        <ActivitySupport key={activity.id} activity={activity} locale={locale} />
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
        </div>
      </div>
    </DefaultTemplate>
  );
};
