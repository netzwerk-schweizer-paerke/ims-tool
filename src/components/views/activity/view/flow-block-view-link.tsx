import { PropsWithChildren } from 'react'
import Link from 'next/link'

type Props = PropsWithChildren & {
  flowId: number
}

export const FlowBlockViewLink: React.FC<Props> = ({ flowId, children }) => {
  return (
    <Link
      className={'link hyphens-auto no-underline hover:underline'}
      href={`/admin/flow/${flowId}`}>
      {children}
    </Link>
  )
}
