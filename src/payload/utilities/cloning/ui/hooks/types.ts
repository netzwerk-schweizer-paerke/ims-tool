import { GenericCloneStatisticsFinalized } from '../../types'

export interface CloneConfig {
  endpoint: string
  resourceName: string
  timeoutMultiplier?: number
  retryConfig?: {
    limit: number
    methods: string[]
    statusCodes: number[]
  }
}

export type CloneStatus = 'error' | 'success' | 'partial' | ''

export interface CloneResults {
  data: GenericCloneStatisticsFinalized
  successLevel: 'success' | 'partial' | 'fail'
}

export interface TargetOrganisation {
  label: string
  value: number
}

export interface CloneFormData {
  selectedItems: string[]
  targetOrganisation: TargetOrganisation
}

export interface CloneApiResponse {
  message: string
  results: GenericCloneStatisticsFinalized
}

export interface UseCloneStateResult {
  cloning: boolean
  status: CloneStatus
  targetOrgId: number | null
  targetOrgName: string
  cloneResults: GenericCloneStatisticsFinalized | null
  errorMessage: string
  setCloning: (cloning: boolean) => void
  setStatus: (status: CloneStatus) => void
  setTargetOrgId: (id: number | null) => void
  setTargetOrgName: (name: string) => void
  setCloneResults: (results: GenericCloneStatisticsFinalized | null) => void
  setErrorMessage: (message: string) => void
  resetState: () => void
}

export interface UseCloneApiResult {
  executeClone: (
    config: CloneConfig,
    formData: CloneFormData,
    locale: string,
  ) => Promise<GenericCloneStatisticsFinalized>
  processError: (error: any) => string
}

export interface UseCloneLoadingStateResult {
  // No return values needed - just side effects
}

export interface UseCloneModalResult {
  handleClose: () => void
}

export interface UseCloneOrgSwitchResult {
  handleOrgSwitch: () => Promise<void>
  isSwitching: boolean
}

export interface UseCloneFormSubmitResult {
  handleSubmit: (config: CloneConfig, formData: CloneFormData) => Promise<void>
}

export interface UseCloneOverlayResult {
  // State
  cloning: boolean
  status: CloneStatus
  targetOrgId: number | null
  targetOrgName: string
  cloneResults: GenericCloneStatisticsFinalized | null
  errorMessage: string
  isSwitching: boolean

  // Actions
  handleSubmit: (config: CloneConfig, formData: CloneFormData) => Promise<void>
  handleClose: () => void
  handleOrgSwitch: () => Promise<void>
}
