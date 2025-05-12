import { PropsWithChildren, memo } from 'react'

type Props = PropsWithChildren & {
  id: string | null | undefined
  comboTarget?: 'left' | 'right' | false
}

export const RootTargetName = 'root-target'
export const RootTargetLeftName = 'root-target-left'
export const RootTargetRightName = 'root-target-right'

// Define the component
const RootTargetComponent: React.FC<Props> = ({ children, id, comboTarget = false }) => {
  if (!id) {
    throw new Error('RootTarget requires an id prop')
  }
  if (comboTarget === 'left') {
    return (
      <div id={`${id}-${RootTargetLeftName}`} className={'root-target root-target__left'}>
        {children}
      </div>
    )
  }
  if (comboTarget === 'right') {
    return (
      <div id={`${id}-${RootTargetRightName}`} className={'root-target root-target__right'}>
        {children}
      </div>
    )
  }
  return (
    <div id={`${id}-${RootTargetName}`} className={'root-target'}>
      {children}
    </div>
  )
}

// Export the memoized component
export const RootTarget = memo(RootTargetComponent)
