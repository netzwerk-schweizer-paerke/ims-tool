import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { ViewLinks } from '@/components/views/view-links'

type Props = PropsWithChildren & {
  links: ViewLinks
  listId: number
}

export const ListBlockViewLink = ({ children, links, listId }: Props) => {
  return (
    <Link className={'link no-underline hover:underline'} href={`${links.basePath}/list/${listId}`}>
      {children}
    </Link>
  )
}
