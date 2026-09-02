'use client'
import { PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  mode?: 'edit' | 'view'
}

export const TaskShapeWrapper = ({ children, mode = 'view' }: Props) => {
  const wrapperClasses = mode === 'edit' ? 'h-32 overflow-visible' : 'size-full overflow-visible'

  return (
    <div
      className={`task-shape-wrapper relative rounded-xl border-2 bg-[--theme-bg] ${wrapperClasses}`}>
      <div
        className={
          'relative z-10 flex size-full items-center justify-center px-1 py-4 text-center'
        }>
        {children}
      </div>
    </div>
  )
}
