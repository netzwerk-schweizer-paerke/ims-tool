import Link from 'next/link'

import { ViewLinks } from '@/components/views/view-links'
import { Translate } from '@/lib/translate'

type Props = {
  activityId: number
  links: ViewLinks
  locale: string
}

/**
 * The column body when the activity carries no name in the current content locale. All three
 * landscape column types render it, so the empty state stays identical in each of them.
 */
export const ActivityUntranslated = ({ activityId, links, locale }: Props) => {
  return (
    <div
      className={
        'mx-auto flex max-w-64 flex-col items-center gap-4 self-start rounded-md border border-dashed p-4 text-center [border-color:var(--theme-elevation-150)]'
      }>
      <p className={'text-sm leading-relaxed [color:var(--theme-elevation-650)]'}>
        <Translate
          k={'activityOverview:notAvailableInLocale'}
          vars={{ locale: locale.toUpperCase() }}
        />
      </p>
      {links.showEdit && (
        <Link
          className={
            'inline-flex items-center rounded px-3 py-2 text-sm font-medium no-underline transition-colors [background-color:var(--theme-elevation-100)] [color:var(--theme-elevation-800)] hover:[background-color:var(--theme-elevation-200)]'
          }
          href={`/admin/collections/activities/${activityId}?locale=${locale}`}>
          <Translate k={'activityOverview:viewInEditMode'} />
        </Link>
      )}
    </div>
  )
}
