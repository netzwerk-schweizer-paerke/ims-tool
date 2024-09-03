'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Translate } from '@/lib/translate';

export const ActivityLandscapeLink: React.FC = () => {
  const pathname = usePathname();

  const isActivityRoute = pathname.endsWith('/admin/activities');
  const isActivityDetailRoute =
    pathname.includes('/admin/views/activity/') && pathname.includes('/block/');

  const isAdminDashboard =
    pathname.startsWith('/admin') && !isActivityRoute && !isActivityDetailRoute;

  return (
    <div className={'nav-group pb-8'}>
      <div className={'nav-group__toggle'}>
        <Translate k={'admin:links:title'} />
      </div>
      <div className={'nav-group__content'}>
        <div className={'nav__link'}>
          <Link href={'/admin'}>
            <Translate k={'admin:links:dashboard'} />
          </Link>
        </div>
        <div className={'nav__link'}>
          <Link href={'/admin/activities'}>
            <Translate k={'admin:links:activityLandscape'} />
          </Link>
        </div>
      </div>
    </div>
  );
};
