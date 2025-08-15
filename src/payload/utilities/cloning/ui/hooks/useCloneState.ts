import { useState } from 'react'
import { GenericCloneStatisticsFinalized } from '../../types'
import { CloneStatus, UseCloneStateResult } from './types'

/**
 * Manages all clone-related state
 */
export function useCloneState(): UseCloneStateResult {
  const [cloning, setCloning] = useState(false)
  const [status, setStatus] = useState<CloneStatus>('')
  const [targetOrgId, setTargetOrgId] = useState<number | null>(null)
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
    cloning,
    status,
    targetOrgId,
    targetOrgName,
    cloneResults,
    errorMessage,
    setCloning,
    setStatus,
    setTargetOrgId,
    setTargetOrgName,
    setCloneResults,
    setErrorMessage,
    resetState,
  }
}
