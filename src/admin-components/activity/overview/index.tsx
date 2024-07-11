import React from 'react';
import { AdminViewProps } from 'payload';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { headers as getHeaders } from 'next/headers';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';
import { ActivityFlow } from '@/admin-components/activity/overview/activity/activity-flow';

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
      //   TODO: Implement doc order sorting
    })
    .then((res) => {
      if (res.docs.length === 0) {
        return null;
      }
      return res.docs;
    });

  return (
    <DefaultTemplate
      i18n={req.i18n}
      payload={req.payload}
      visibleEntities={initPageResult.visibleEntities}>
      <div
        style={{
          marginTop: 'calc(var(--base) * 2)',
          paddingLeft: 'var(--gutter-h)',
          paddingRight: 'var(--gutter-h)',
        }}>
        <title />
        <div className={'mt-8 flex flex-row gap-16'}>
          {activities ? (
            activities.map((activity) => (
              <ActivityFlow key={activity.id} activity={activity} locale={locale} />
            ))
          ) : (
            <div>No activities found</div>
          )}
        </div>
      </div>
    </DefaultTemplate>
  );
};
