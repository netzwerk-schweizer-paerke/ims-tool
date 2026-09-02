import { GenericCloneStatisticsFinalized } from '../../types'

export interface CloneApiResponse {
  message: string
  results: GenericCloneStatisticsFinalized
}

export interface CloneConfig {
  endpoint: string
  resourceName: string
  retryConfig?: {
    limit: number
    methods: string[]
    statusCodes: number[]
  }
  timeoutMultiplier?: number
}

export interface CloneFormData {
  selectedItems: string[]
  targetOrganisation: TargetOrganisation
}

export interface CloneResults {
  data: GenericCloneStatisticsFinalized
  successLevel: 'fail' | 'partial' | 'success'
}

export type CloneStatus = '' | 'error' | 'partial' | 'success'

export interface TargetOrganisation {
  label: string
  value: number
}

export interface UseCloneApiResult {
  executeClone: (
    config: CloneConfig,
    formData: CloneFormData,
    locale: string,
  ) => Promise<GenericCloneStatisticsFinalized>
  processError: (error: unknown) => Promise<string>
}

export interface UseCloneFormSubmitResult {
  handleSubmit: (config: CloneConfig, formData: CloneFormData) => Promise<void>
}

// No return values needed - just side effects (the hook returns `{}`).
export type UseCloneLoadingStateResult = Record<string, never>

export interface UseCloneModalResult {
  handleClose: () => void
}

export interface UseCloneOrgSwitchResult {
  handleOrgSwitch: () => Promise<void>
  isSwitching: boolean
}

export interface UseCloneOverlayResult {
  cloneResults: GenericCloneStatisticsFinalized | null
  // State
  cloning: boolean
  errorMessage: string
  handleClose: () => void
  handleOrgSwitch: () => Promise<void>
  // Actions
  handleSubmit: (config: CloneConfig, formData: CloneFormData) => Promise<void>
  isSwitching: boolean

  status: CloneStatus
  targetOrgId: null | number
  targetOrgName: string
}

export interface UseCloneStateResult {
  cloneResults: GenericCloneStatisticsFinalized | null
  cloning: boolean
  errorMessage: string
  resetState: () => void
  setCloneResults: (results: GenericCloneStatisticsFinalized | null) => void
  setCloning: (cloning: boolean) => void
  setErrorMessage: (message: string) => void
  setStatus: (status: CloneStatus) => void
  setTargetOrgId: (id: null | number) => void
  setTargetOrgName: (name: string) => void
  status: CloneStatus
  targetOrgId: null | number
  targetOrgName: string
}
