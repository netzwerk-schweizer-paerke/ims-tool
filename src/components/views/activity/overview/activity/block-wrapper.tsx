import { PropsWithChildren, ReactNode } from 'react'

import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTargetName } from '@/components/graph/fields/graph/lib/root-target'

type Props = PropsWithChildren & {
  /** A menu in the padding corner. It sits outside the root target, so the arrows keep their box. */
  actions?: ReactNode
  id: null | string | undefined
}

export const BlockWrapper = ({ actions, children, id }: Props) => {
  if (!id) {
    throw new Error('BlockWrapper requires an id prop')
  }
  return (
    <div className={'activity-block relative p-8'}>
      {/* The height must match `min-h-32` on the shape wrapper. A shorter box lets the shape
          overflow, and the arrow then starts inside the visible border. */}
      <div className={'flex h-32 w-52 items-center justify-center text-center'}>
        <div className={'root-target size-full'} id={`${id}-${RootTargetName}`}>
          {children}
        </div>
      </div>
      <OuterTargets id={id} />
      {actions && <div className={'absolute right-1 top-1 z-10'}>{actions}</div>}
    </div>
  )
}
