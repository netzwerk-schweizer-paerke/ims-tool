import React from 'react';
import { InitPageResult } from 'payload';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { OverviewTitle } from '@/payload/admin-components/activity-landscape-view/overview';

export const ActivityLandscapeView = ({ initPageResult }: { initPageResult: InitPageResult }) => {
  const { permissions, req } = initPageResult;
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
        <OverviewTitle />
        <p>This custom view was added through the Payload config:</p>
        <ul>
          <li>
            <code>components.views[key].Component</code>
          </li>
        </ul>
      </div>
    </DefaultTemplate>
  );
};
