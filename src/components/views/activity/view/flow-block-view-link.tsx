import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { ViewLinks } from '@/components/views/view-links'

type Props = PropsWithChildren & {
  flowId: number
  links: ViewLinks
}

export const FlowBlockViewLink = ({ children, flowId, links }: Props) => {
  return (
    <Link className={'link no-underline hover:underline'} href={`${links.basePath}/flow/${flowId}`}>
      {children}
    </Link>
  )
}
