import Link from 'next/link'
import { Translate } from '@/lib/translate'

type Props = {
  id: string | number | null
  locale: string
}

export const ActivityEditLink: React.FC<Props> = ({ id, locale }) => {
  return (
    <Link
      className={'link-hover link'}
      href={`/admin/collections/activities/${id}?locale=${locale}`}>
      <Translate k={'common:edit'} />
    </Link>
  )
}
