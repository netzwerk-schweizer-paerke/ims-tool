import { useEffect } from 'react'
import { UseCloneLoadingStateResult } from './types'

/**
 * Manages loading states and scroll lock effect
 */
export function useCloneLoadingState(cloning: boolean): UseCloneLoadingStateResult {
  // Scroll lock effect when cloning
  useEffect(() => {
    if (cloning) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [cloning])

  return {}
}
