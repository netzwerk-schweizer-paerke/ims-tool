import { FC, PropsWithChildren } from 'react'
import Link from 'next/link'

type Props = PropsWithChildren & {
  listId: number
}

export const ListBlockViewLink: FC<Props> = ({ listId, children }) => {
  return (
    <Link
      className={'link hyphens-auto no-underline hover:underline'}
      href={`/admin/list/${listId}`}
    >
      {children}
    </Link>
  )
}
