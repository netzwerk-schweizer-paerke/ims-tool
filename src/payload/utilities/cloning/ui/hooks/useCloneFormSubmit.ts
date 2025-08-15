import { useLocale } from '@payloadcms/ui'
import { useCloneApi } from './useCloneApi'
import { CloneConfig, CloneFormData, UseCloneFormSubmitResult, UseCloneStateResult } from './types'

/**
 * Form submission orchestration that combines the other hooks
 */
export function useCloneFormSubmit(cloneState: UseCloneStateResult): UseCloneFormSubmitResult {
  const locale = useLocale()
  const { executeClone, processError } = useCloneApi()

  const handleSubmit = async (config: CloneConfig, formData: CloneFormData) => {
    const { selectedItems, targetOrganisation } = formData
    const {
      setCloning,
      setStatus,
      setCloneResults,
      setErrorMessage,
      setTargetOrgId,
      setTargetOrgName,
    } = cloneState

    setCloning(true)
    setStatus('') // Clear any previous status
    setCloneResults(null)
    setErrorMessage('')

    // Store target organization for potential switching later
    setTargetOrgId(targetOrganisation.value)
    setTargetOrgName(targetOrganisation.label)

    // Validate inputs
    if (!selectedItems.length) {
      setErrorMessage(`No ${config.resourceName} selected for cloning`)
      setStatus('error')
      setCloning(false)
      return
    }

    if (!targetOrganisation?.value) {
      setErrorMessage('No target organisation selected')
      setStatus('error')
      setCloning(false)
      return
    }

    try {
      const results = await executeClone(config, formData, locale.code)

      // Process results
      setCloneResults(results)

      // Set status based on successLevel from response
      const { successLevel } = results
      if (successLevel === 'success') {
        setStatus('success')
      } else if (successLevel === 'partial') {
        setStatus('partial')
      } else {
        setStatus('error')
      }
    } catch (error: any) {
      console.error(`Failed to clone ${config.resourceName}:`, error)
      const errorMessage = processError(error)
      setErrorMessage(errorMessage)
      setStatus('error')
    }

    setCloning(false)
  }

  return {
    handleSubmit,
  }
}
