import Link from 'next/link'
import { FC, PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  listId: number
}

export const ListBlockViewLink: FC<Props> = ({ children, listId }) => {
  return (
    <Link
      className={'link hyphens-auto no-underline hover:underline'}
      href={`/admin/list/${listId}`}>
      {children}
    </Link>
  )
}
