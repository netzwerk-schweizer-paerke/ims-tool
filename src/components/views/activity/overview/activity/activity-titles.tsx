import { ActivityEditLink } from '@/components/views/activity/overview/activity/activity-edit-link'
import { ViewLinks } from '@/components/views/view-links'
import { Translate } from '@/lib/translate'
import { Activity } from '@/payload-types'

type Props = {
  activity: Activity
  links: ViewLinks
  locale: string
}

export const ActivityTitles = ({ activity, links, locale }: Props) => {
  // The placeholder is admin-language text, so it carries no `lang` from the content locale.
  // The column body renders the call to action in this state, so the heading adds no edit link.
  if (!activity.name) {
    return (
      <div className={'px-4 text-center'}>
        <h2 className={'text-xl font-bold italic [color:var(--theme-elevation-500)]'}>
          <Translate k={'activityOverview:untitled'} />
        </h2>
      </div>
    )
  }

  return (
    <div className={'px-4 text-center'}>
      <h2 className={'hyphens-auto text-xl font-bold'} lang={locale}>
        {activity.name}
      </h2>
      <ActivityEditLink id={activity.id} links={links} locale={locale} />
    </div>
  )
}
