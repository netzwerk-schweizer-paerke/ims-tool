import { useModal } from '@payloadcms/ui'
import { GenericCloneStatisticsFinalized } from '../../types'
import { UseCloneModalResult } from './types'

/**
 * Modal management, close handling, and page reload logic
 */
export function useCloneModal(
  drawerSlug: string,
  cloneResults: GenericCloneStatisticsFinalized | null,
  resetState: () => void,
): UseCloneModalResult {
  const { closeModal } = useModal()

  const handleClose = () => {
    // Only reload if there were successful clones (at least one entity cloned)
    const shouldReload = Boolean(cloneResults && cloneResults.entities.length > 0)

    // Reset state
    resetState()
    closeModal(drawerSlug)

    // Reload page to show new items if any were created
    if (shouldReload) {
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }

  return {
    handleClose,
  }
}
