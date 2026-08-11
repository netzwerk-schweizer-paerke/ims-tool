import Link from 'next/link'
import { PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  flowId: number
}

export const FlowBlockViewLink: React.FC<Props> = ({ children, flowId }) => {
  return (
    <Link
      className={'link hyphens-auto no-underline hover:underline'}
      href={`/admin/flow/${flowId}`}>
      {children}
    </Link>
  )
}
