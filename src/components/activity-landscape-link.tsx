'use client'
import Link from 'next/link'

import { Translate } from '@/lib/translate'

export const ActivityLandscapeLink = () => {
  return (
    <div className={'nav-group pb-8'}>
      <div className={'nav-group__toggle'}>
        <Translate k={'admin:links:title'} />
      </div>
      <div className={'nav-group__content'}>
        <div className={'nav__link'}>
          <Link href={'/admin/activities'}>
            <Translate k={'admin:links:activityLandscape'} />
          </Link>
        </div>
      </div>
    </div>
  )
}
