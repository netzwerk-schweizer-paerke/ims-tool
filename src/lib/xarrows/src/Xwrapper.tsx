'use client'
import React, { FC, ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react'

// Contexts for arrow update coordination
export const XelemContext = React.createContext<() => void>(() => {})
export const XarrowContext = React.createContext<() => void>(() => {})

interface XwrapperProps {
  children: ReactNode
}

const Xwrapper: FC<XwrapperProps> = ({ children }) => {
  const [, setRender] = useState({})
  const updateXarrow = useCallback(() => setRender({}), [])

  // Use React's useId for stable instance identification (SSR-safe)
  const instanceId = useId()
  const updateRefMap = useRef<Map<string, () => void>>(new Map())

  useEffect(() => {
    updateRefMap.current.set(instanceId, updateXarrow)
    return () => {
      updateRefMap.current.delete(instanceId)
    }
  }, [instanceId, updateXarrow])

  // Get the update function for XelemContext (defaults to updateXarrow)
  const xelemUpdate = updateRefMap.current.get(instanceId) ?? updateXarrow

  return (
    <XelemContext.Provider value={xelemUpdate}>
      <XarrowContext.Provider value={updateXarrow}>{children}</XarrowContext.Provider>
    </XelemContext.Provider>
  )
}
export default Xwrapper
