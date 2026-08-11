import { useState } from 'react'

import { GenericCloneStatisticsFinalized } from '../../types'
import { CloneStatus, UseCloneStateResult } from './types'

/**
 * Manages all clone-related state
 */
export function useCloneState(): UseCloneStateResult {
  const [cloning, setCloning] = useState(false)
  const [status, setStatus] = useState<CloneStatus>('')
  const [targetOrgId, setTargetOrgId] = useState<null | number>(null)
  const [targetOrgName, setTargetOrgName] = useState<string>('')
  const [cloneResults, setCloneResults] = useState<GenericCloneStatisticsFinalized | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const resetState = () => {
    setCloning(false)
    setStatus('')
    setErrorMessage('')
    setTargetOrgId(null)
    setTargetOrgName('')
    setCloneResults(null)
  }

  return {
    cloneResults,
    cloning,
    errorMessage,
    resetState,
    setCloneResults,
    setCloning,
    setErrorMessage,
    setStatus,
    setTargetOrgId,
    setTargetOrgName,
    status,
    targetOrgId,
    targetOrgName,
  }
}
