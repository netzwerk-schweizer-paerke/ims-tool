import Link from 'next/link'
import { PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  listId: number
}

export const ListBlockViewLink = ({ children, listId }: Props) => {
  return (
    <Link
      className={'link no-underline hover:underline'}
      href={`/admin/list/${listId}`}>
      {children}
    </Link>
  )
}
