import React from 'react';
import { payload } from '@/lib/payload';

export const ActivityLandscapeLink: React.FC = async () => {
  const client = await payload();
  return (
    <div className={'mb-8 w-full'}>
      <a className={'link-hover link'} href={'/admin/activity-landscape'}>
        Activity Landscape
      </a>
    </div>
  );
};
