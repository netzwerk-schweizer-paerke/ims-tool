import { memo, PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  comboTarget?: 'left' | 'right' | false
  id: null | string | undefined
}

export const RootTargetName = 'root-target'
export const RootTargetLeftName = 'root-target-left'
export const RootTargetRightName = 'root-target-right'

// Define the component
const RootTargetComponent: React.FC<Props> = ({ children, comboTarget = false, id }) => {
  const debug = process.env.NODE_ENV === 'development'
  const debugIndicator = debug && (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500" />
  )

  if (!id) {
    throw new Error('RootTarget requires an id prop')
  }
  if (comboTarget === 'left') {
    return (
      <div className={'root-target root-target__left relative'} id={`${id}-${RootTargetLeftName}`}>
        {debugIndicator}
        {children}
      </div>
    )
  }
  if (comboTarget === 'right') {
    return (
      <div className={'root-target root-target__right relative'} id={`${id}-${RootTargetRightName}`}>
        {debugIndicator}
        {children}
      </div>
    )
  }
  return (
    <div className={'root-target relative'} id={`${id}-${RootTargetName}`}>
      {debugIndicator}
      {children}
    </div>
  )
}

// Export the memoized component
export const RootTarget = memo(RootTargetComponent)
