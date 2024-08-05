import React from 'react';
import { AdminViewProps } from 'payload';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { headers as getHeaders } from 'next/headers';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';
import { ActivityFlow } from '@/admin-components/activity/overview/activity/activity-flow';
import { ActivitySupport } from '@/admin-components/activity/overview/activity/activity-support';
import { LandscapeBg } from '@/admin-components/activity/overview/landscape-bg';
import { ActivityStrategy } from '@/admin-components/activity/overview/activity/activity-strategy';
import { Translate } from '@/lib/translate';
import Link from 'next/link';

export const ActivitiesView: React.FC<AdminViewProps> = async ({ initPageResult }) => {
  const headers = getHeaders();
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
                  <div className={'relative flex flex-row items-stretch justify-stretch pr-8'}>
                    <LandscapeBg />
                    {strategicActivity.map((activity) => (
                      <ActivityStrategy key={activity.id} activity={activity} locale={locale} />
                    ))}
                  </div>
                ) : (
                  <div>
                    <Translate k={'activityLandscape:noBlocks'} />
                  </div>
                )}
                {standardActivities ? (
                  <div className={'flex flex-row items-stretch justify-stretch'}>
                    {standardActivities.map((activity) => (
                      <ActivityFlow key={activity.id} activity={activity} locale={locale} />
                    ))}
                  </div>
                ) : (
                  <div>
                    <Translate k={'activityLandscape:noBlocks'} />
                  </div>
                )}
                {supportActivities ? (
                  <div
                    className={
                      'relative flex min-w-fit flex-row items-stretch justify-stretch pl-8'
                    }>
                    <LandscapeBg rotate={180} />
                    {supportActivities.map((activity) => (
                      <ActivitySupport key={activity.id} activity={activity} locale={locale} />
                    ))}
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
