import { useCloneState } from './useCloneState'
import { useCloneLoadingState } from './useCloneLoadingState'
import { useCloneModal } from './useCloneModal'
import { useCloneOrgSwitch } from './useCloneOrgSwitch'
import { useCloneFormSubmit } from './useCloneFormSubmit'
import { TargetOrganisation, UseCloneOverlayResult } from './types'

/**
 * Master hook that orchestrates all clone functionality
 */
export function useCloneOverlay(
  drawerSlug: string,
  targetOrganisations: TargetOrganisation[],
): UseCloneOverlayResult {
  // Initialize all state
  const cloneState = useCloneState()
  const { cloning, targetOrgId, cloneResults } = cloneState

  // Initialize sub-hooks
  useCloneLoadingState(cloning)
  const { handleClose } = useCloneModal(drawerSlug, cloneResults, cloneState.resetState)
  const { handleOrgSwitch, isSwitching } = useCloneOrgSwitch(targetOrgId, targetOrganisations)
  const { handleSubmit } = useCloneFormSubmit(cloneState)

  return {
    // State
    cloning: cloneState.cloning,
    status: cloneState.status,
    targetOrgId: cloneState.targetOrgId,
    targetOrgName: cloneState.targetOrgName,
    cloneResults: cloneState.cloneResults,
    errorMessage: cloneState.errorMessage,
    isSwitching,

    // Actions
    handleSubmit,
    handleClose,
    handleOrgSwitch,
  }
}
