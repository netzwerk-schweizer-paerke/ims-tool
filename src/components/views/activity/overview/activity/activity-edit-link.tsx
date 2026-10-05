import { ItemActions } from '@/components/clipboard/item-actions'
import { ViewLinks } from '@/components/views/view-links'
import { Activity } from '@/payload-types'

type Props = {
  activity: Activity
  links: ViewLinks
  locale: string
}

/**
 * The menu under a Thema heading: edit, copy the Thema, and paste a Prozessgruppe into it
 * (PIMS-83). A public share page has no editor, so it renders nothing there.
 */
export const ActivityEditLink = ({ activity, links, locale }: Props) => {
  if (!links.showEdit) {
    return null
  }

  const organisationId = links.canCopy ? (links.organisationId ?? null) : null

  return (
    <div className={'flex justify-center'}>
      <ItemActions
        copyItem={
          organisationId === null
            ? undefined
            : { id: activity.id, kind: 'activity', label: activity.name ?? '', organisationId }
        }
        editHref={`/admin/collections/activities/${activity.id}?locale=${locale}`}
        pasteTarget={
          organisationId === null
            ? undefined
            : { activityId: activity.id, kind: 'activity', organisationId }
        }
      />
    </div>
  )
}
