import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { ViewLinks } from '@/components/views/view-links'

type Props = PropsWithChildren & {
  activityId: number
  blockId: null | string | undefined
  links: ViewLinks
}

export const ActivityBlockViewLink = ({ activityId, blockId, children, links }: Props) => {
  return (
    <Link
      className={'link no-underline hover:underline'}
      href={`${links.basePath}/activity/${activityId}/block/${blockId}`}>
      {children}
    </Link>
  )
}
