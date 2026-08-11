import { toNumber } from 'es-toolkit/compat'
import ky from 'ky'

import { GenericCloneStatisticsFinalized } from '../../types'
import { CloneApiResponse, CloneConfig, CloneFormData, UseCloneApiResult } from './types'

/**
 * Handles API calls with error handling and response processing
 */
export function useCloneApi(): UseCloneApiResult {
  const executeClone = async (
    config: CloneConfig,
    formData: CloneFormData,
    locale: string,
  ): Promise<GenericCloneStatisticsFinalized> => {
    const { endpoint, retryConfig, timeoutMultiplier = 120_000 } = config
    const { selectedItems, targetOrganisation } = formData

    const defaultRetryConfig = {
      limit: 2,
      methods: ['post'],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
    }

    const response = await ky
      .post<CloneApiResponse>(endpoint, {
        json: {
          ids: selectedItems.map((id) => toNumber(id)),
          locale,
          targetOrganisationId: targetOrganisation.value,
        },
        retry: retryConfig || defaultRetryConfig,
        timeout: timeoutMultiplier * selectedItems.length,
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
