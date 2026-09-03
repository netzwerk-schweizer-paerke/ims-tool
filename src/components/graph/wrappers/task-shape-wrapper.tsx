'use client'
import { PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  mode?: 'edit' | 'view'
}

export const TaskShapeWrapper = ({ children, mode = 'view' }: Props) => {
  // The edit branch keeps the 2px outline, which stays visible while the user drags and types.
  const wrapperClasses =
    mode === 'edit'
      ? 'h-32 border-2 overflow-visible'
      : 'size-full min-h-32 min-w-52 border overflow-visible'

  return (
    <div
      className={`task-shape-wrapper relative flex items-center justify-center rounded-xl bg-[--theme-bg] ${wrapperClasses}`}>
      <div
        className={
          'relative z-10 flex size-full items-center justify-center px-1 py-4 text-center'
        }>
        {children}
      </div>
    </div>
  )
}
