import { PropsWithChildren } from 'react'
import { OuterTargets } from '@/components/graph/fields/graph/lib/outer-targets'
import { RootTargetName } from '@/components/graph/fields/graph/lib/root-target'

type Props = PropsWithChildren & {
  id: string | null | undefined
}

export const BlockWrapper: React.FC<Props> = ({ children, id }) => {
  if (!id) {
    throw new Error('BlockWrapper requires an id prop')
  }
  return (
    <div className={'activity-block relative p-8'}>
      <div className={'flex h-24 w-52 items-center justify-center text-center'}>
        <div id={`${id}-${RootTargetName}`} className={'root-target size-full'}>
          {children}
        </div>
      </div>
      <OuterTargets id={id} />
    </div>
  )
}
