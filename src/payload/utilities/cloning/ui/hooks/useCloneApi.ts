import ky from 'ky'
import { toNumber } from 'es-toolkit/compat'
import { GenericCloneStatisticsFinalized } from '../../types'
import { CloneConfig, CloneFormData, CloneApiResponse, UseCloneApiResult } from './types'

/**
 * Handles API calls with error handling and response processing
 */
export function useCloneApi(): UseCloneApiResult {
  const executeClone = async (
    config: CloneConfig,
    formData: CloneFormData,
    locale: string,
  ): Promise<GenericCloneStatisticsFinalized> => {
    const { endpoint, timeoutMultiplier = 120000, retryConfig } = config
    const { selectedItems, targetOrganisation } = formData

    const defaultRetryConfig = {
      limit: 2,
      methods: ['post'],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
    }

    const response = await ky
      .post<CloneApiResponse>(endpoint, {
        json: {
          locale,
          targetOrganisationId: targetOrganisation.value,
          ids: selectedItems.map((id) => toNumber(id)),
        },
        timeout: timeoutMultiplier * selectedItems.length,
        retry: retryConfig || defaultRetryConfig,
      })
      .json()

    // Validate response structure
    if (!('results' in response) || !response.results) {
      throw new Error('Invalid response structure from clone endpoint')
    }

    return response.results
  }

  const processError = (error: any): string => {
    let errorMessage = 'Unknown error occurred'

    // Handle different error types
    if (error.name === 'HTTPError') {
      if (error.response?.status === 403) {
        errorMessage =
          '🚫 Access Denied: You do not have the required permissions for this operation'
      } else {
        try {
          // This is async but we can't await here, so we'll use a fallback
          errorMessage = `HTTP ${error.response?.status || 'unknown'} error`
        } catch {
          errorMessage = `HTTP ${error.response?.status || 'unknown'} error`
        }
      }
    } else if (error.name === 'TimeoutError') {
      errorMessage = '⏱️ Request timed out. The items may be too large to clone.'
    } else if (error.message) {
      errorMessage = error.message
    }

    return errorMessage
  }

  return {
    executeClone,
    processError,
  }
}
