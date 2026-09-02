import { PropsWithChildren } from 'react'

import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTargetName } from '@/components/graph/fields/graph/lib/root-target'

type Props = PropsWithChildren & {
  id: null | string | undefined
  spacing?: 'auto' | 'full'
}

export const BlockWrapper: React.FC<Props> = ({ children, id, spacing = 'full' }) => {
  if (!id) {
    throw new Error('BlockWrapper requires an id prop')
  }
  return (
    <div className={`block-wrapper relative flex size-full items-center justify-center p-8`}>
      <div className={'relative flex min-h-32 min-w-48 items-center justify-center text-center'}>
        <div
          className={`root-target ${spacing === 'full' ? 'w-full' : ''}`}
          id={`${id}-${RootTargetName}`}>
          {children}
        </div>
      </div>
      <OuterTargets id={id} />
    </div>
  )
}
