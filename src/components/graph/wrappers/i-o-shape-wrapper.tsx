'use client'
import { PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  mode?: 'edit' | 'view'
}

export const IOShapeWrapper = ({ children, mode = 'view' }: Props) => {
  // The edit branch keeps the 2px outline, which stays visible while the user drags and types.
  const wrapperClasses =
    mode === 'edit'
      ? 'h-32 border-2 overflow-visible max-w-64'
      : 'size-full min-h-32 min-w-52 border overflow-visible'

  return (
    <div
      className={`io-shape-wrapper relative flex items-center justify-center rounded-full bg-[--theme-bg] ${wrapperClasses}`}>
      <div
        // The shape is `rounded-full`, so the end caps cut into the text. A rectangle clears with
        // `px-1`; this one needs more, or a long label touches the curve.
        className={
          'relative z-10 flex size-full items-center justify-center px-4 py-4 text-center'
        }>
        {children}
      </div>
    </div>
  )
}
