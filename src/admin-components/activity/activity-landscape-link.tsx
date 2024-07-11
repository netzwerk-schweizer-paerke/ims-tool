'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Translate } from '@/lib/translate';

export const ActivityLandscapeLink: React.FC = () => {
  const pathname = usePathname();

  const isActivityRoute = pathname.endsWith('/admin/activities');
  const isActivityDetailRoute =
    pathname.includes('/admin/activity/') && pathname.includes('/block/');

  const isAdminDashboard =
    pathname.startsWith('/admin') && !isActivityRoute && !isActivityDetailRoute;

  return (
    <>
      <h2>
        <Translate k={'admin:links:title'} />
      </h2>
      <ul className={'text-md menu mb-8 w-full text-lg'}>
        {isActivityRoute && (
          <li>
            <Link href={'/admin'}>
              <Translate k={'admin:links:dashboard'} />
            </Link>
          </li>
        )}
        {(isActivityDetailRoute || isAdminDashboard) && (
          <li>
            <Link href={'/admin/activities'}>
              <Translate k={'admin:links:activityLandscape'} />
            </Link>
          </li>
        )}
      </ul>
    </>
  );
};
