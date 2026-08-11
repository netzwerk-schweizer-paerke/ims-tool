'use client'
import React, { FC, ReactNode, useCallback, useState } from 'react'

// Consumed by useXarrow. The value is referentially stable, so calling it re-renders
// Xwrapper itself and React bails out of the unchanged children — descendants are not
// re-rendered through this context. Arrows keep themselves in sync through their own
// ResizeObserver and the element positions useXarrowProps reads each render.
export const XelemContext = React.createContext<() => void>(() => {})

interface XwrapperProps {
  children: ReactNode
}

const Xwrapper: FC<XwrapperProps> = ({ children }) => {
  const [, setRender] = useState({})
  const updateXarrow = useCallback(() => setRender({}), [])

  return <XelemContext.Provider value={updateXarrow}>{children}</XelemContext.Provider>
}
export default Xwrapper
