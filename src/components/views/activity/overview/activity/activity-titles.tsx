import { ActivityEditLink } from '@/components/views/activity/overview/activity/activity-edit-link'
import { ViewLinks } from '@/components/views/view-links'
import { Activity } from '@/payload-types'

type Props = {
  activity: Activity
  links: ViewLinks
  locale: string
}

export const ActivityTitles = ({ activity, links, locale }: Props) => {
  return (
    <div className={'px-4 text-center'}>
      <h2 className={'hyphens-auto text-xl font-bold'} lang={locale}>
        {activity.name}
      </h2>
      <ActivityEditLink id={activity.id} links={links} locale={locale} />
    </div>
  )
}
