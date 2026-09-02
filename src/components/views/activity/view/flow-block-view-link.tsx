import Link from 'next/link'
import { PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  flowId: number
}

export const FlowBlockViewLink = ({ children, flowId }: Props) => {
  return (
    <Link
      className={'link hyphens-auto no-underline hover:underline'}
      href={`/admin/flow/${flowId}`}>
      {children}
    </Link>
  )
}
