import Link from 'next/link'

import { ViewLinks } from '@/components/views/view-links'
import { Translate } from '@/lib/translate'

type Props = {
  id: null | number | string
  links: ViewLinks
  locale: string
}

export const ActivityEditLink = ({ id, links, locale }: Props) => {
  // A public share page has no editor, so it renders no edit link at all.
  if (!links.showEdit) {
    return null
  }

  return (
    <Link
      className={
        'text-sm underline underline-offset-4 opacity-70 transition-opacity hover:opacity-100'
      }
      href={`/admin/collections/activities/${id}?locale=${locale}`}>
      <Translate k={'common:edit'} />
    </Link>
  )
}
