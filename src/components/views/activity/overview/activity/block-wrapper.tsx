import { PropsWithChildren } from 'react'

import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTargetName } from '@/components/graph/fields/graph/lib/root-target'

type Props = PropsWithChildren & {
  id: null | string | undefined
}

export const BlockWrapper = ({ children, id }: Props) => {
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
    </div>
  )
}
