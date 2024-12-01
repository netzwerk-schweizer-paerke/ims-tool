'use client'
import { PropsWithChildren } from 'react'
import './shapestyle.css'
import './test-shape-wrapper.css'

type Props = PropsWithChildren & {
  mode?: 'edit' | 'view'
}

export const TestShapeWrapper: React.FC<Props> = ({ children, mode = 'view' }) => {
  const wrapperClasses =
    mode === 'edit' ? 'left-0 top-1/2 -translate-y-1/2' : ' left-0 top-0 -translate-y-1/2'

  return (
    <div className={`test-shape-wrapper`}>
      <div
        className={`test-shape-wrapper__inner absolute ${wrapperClasses} bg-base-100/80 z-50 flex w-full items-center justify-center text-center`}
      >
        {children}
      </div>
      <div className="shape z-0 h-6 w-10">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" width={'100%'} height={'100%'}>
          <polygon points="50,0 100,50 50,100 0,50" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  )
}
