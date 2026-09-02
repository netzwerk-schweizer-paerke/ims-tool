'use client'
import { PropsWithChildren } from 'react'

export const BlockTaskWrapper = ({ children }: PropsWithChildren) => {
  return (
    <div
      className={
        'block-task-wrapper relative flex size-full min-h-60 flex-col items-center justify-center'
      }>
      {children}
    </div>
  )
}
