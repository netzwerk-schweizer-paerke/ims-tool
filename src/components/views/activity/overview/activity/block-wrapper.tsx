import { PropsWithChildren, ReactNode } from 'react'

import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTargetName } from '@/components/graph/fields/graph/lib/root-target'

type Props = PropsWithChildren & {
  /** A menu in the padding corner. It sits outside the root target, so the arrows keep their box. */
  actions?: ReactNode
  id: null | string | undefined
  /** Marks the box for the highlight after a paste. See `use-paste-run.ts`. */
  pasteKey?: string
}

export const BlockWrapper = ({ actions, children, id, pasteKey }: Props) => {
  if (!id) {
    throw new Error('BlockWrapper requires an id prop')
  }
  return (
    <div className={'activity-block relative p-8'}>
      {/* The height must match `min-h-32` on the shape wrapper. A shorter box lets the shape
          overflow, and the arrow then starts inside the visible border. */}
      <div
        className={'flex h-32 w-52 items-center justify-center text-center'}
        data-paste-key={pasteKey}>
        <div className={'root-target relative size-full'} id={`${id}-${RootTargetName}`}>
          {children}
          {/* Inside the box, top right. An absolute child leaves the measured box unchanged. */}
          {actions && <div className={'absolute right-1.5 top-1.5 z-20'}>{actions}</div>}
        </div>
      </div>
      <OuterTargets id={id} />
    </div>
  )
}
