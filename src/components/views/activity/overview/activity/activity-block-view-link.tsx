import Link from 'next/link'
import { PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  activityId: number
  blockId: null | string | undefined
}

export const ActivityBlockViewLink: React.FC<Props> = ({ activityId, blockId, children }) => {
  return (
    <Link
      className={'link hyphens-auto no-underline hover:underline'}
      href={`/admin/activity/${activityId}/block/${blockId}`}>
      {children}
    </Link>
  )
}
