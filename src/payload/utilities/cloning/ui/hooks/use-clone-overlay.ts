import { TargetOrganisation, UseCloneOverlayResult } from './types'
import { useCloneFormSubmit } from './use-clone-form-submit'
import { useCloneLoadingState } from './use-clone-loading-state'
import { useCloneModal } from './use-clone-modal'
import { useCloneOrgSwitch } from './use-clone-org-switch'
import { useCloneState } from './use-clone-state'

/**
 * Master hook that orchestrates all clone functionality
 */
export function useCloneOverlay(
  drawerSlug: string,
  targetOrganisations: TargetOrganisation[],
): UseCloneOverlayResult {
  // Initialize all state
  const cloneState = useCloneState()
  const { cloneResults, cloning, targetOrgId } = cloneState

  // Initialize sub-hooks
  useCloneLoadingState(cloning)
  const { handleClose } = useCloneModal(drawerSlug, cloneResults, cloneState.resetState)
  const { handleOrgSwitch, isSwitching } = useCloneOrgSwitch(targetOrgId, targetOrganisations)
  const { handleSubmit } = useCloneFormSubmit(cloneState)

  return {
    cloneResults: cloneState.cloneResults,
    // State
    cloning: cloneState.cloning,
    errorMessage: cloneState.errorMessage,
    handleClose,
    handleOrgSwitch,
    // Actions
    handleSubmit,
    isSwitching,

    status: cloneState.status,
    targetOrgId: cloneState.targetOrgId,
    targetOrgName: cloneState.targetOrgName,
  }
}
