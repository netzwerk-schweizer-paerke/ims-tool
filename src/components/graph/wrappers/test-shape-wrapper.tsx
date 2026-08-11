'use client'
import { PropsWithChildren } from 'react'

import './shapestyle.css'
import './test-shape-wrapper.css'

type Props = PropsWithChildren & {
  mode?: 'edit' | 'view'
}

export const TestShapeWrapper: React.FC<Props> = ({ children, mode = 'view' }) => {
  // The overlay is absolutely positioned, so `w-full` resolves against the nearest positioned
  // ancestor. In the view that is BlockWrapper's `min-w-48` box; in edit mode it is RootTarget,
  // which has no size of its own and collapses to the `h-6 w-10` diamond below. Edit mode
  // therefore sets its own width and centres on the diamond instead of inheriting 40px.
  const wrapperClasses =
    mode === 'edit'
      ? 'left-1/2 top-1/2 h-32 w-48 -translate-x-1/2 -translate-y-1/2'
      : 'left-0 top-0 w-full -translate-y-1/2'

  return (
    <div className={`test-shape-wrapper`}>
      <div
        className={`test-shape-wrapper__inner absolute ${wrapperClasses} bg-base-100/80 z-50 flex items-center justify-center text-center`}>
        {children}
      </div>
      <div className="shape z-0 h-6 w-10">
        <svg height={'100%'} preserveAspectRatio="none" viewBox="0 0 100 100" width={'100%'}>
          <polygon points="50,0 100,50 50,100 0,50" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  )
}
