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

    // Cloning is not idempotent: a retried request runs the whole clone again.
    // 5xx is excluded because the server may have committed before failing to
    // respond, which would leave duplicate activities behind. 429 is safe — the
    // request was rejected before any work started.
    const defaultRetryConfig = {
      limit: 2,
      methods: ['post'],
      statusCodes: [429],
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

  const processError = async (error: any): Promise<string> => {
    if (error?.name === 'TimeoutError') {
      return '⏱️ Request timed out. The items may be too large to clone.'
    }

    if (error?.name !== 'HTTPError' || !error.response) {
      return error?.message || 'Unknown error occurred'
    }

    const { status } = error.response

    if (status === 401 || status === 403) {
      return '🚫 Access Denied: You do not have the required permissions for this operation'
    }

    // The endpoints put the actual cause in the body. Without reading it the
    // user only ever sees "HTTP 500 error", which is not actionable.
    try {
      const body = await error.response.clone().json()

      if (typeof body?.error === 'string') {
        return body.error
      }

      if (Array.isArray(body?.errors) && body.errors.length > 0) {
        const issues = body.errors as { field?: string; message?: string }[]
        const details = issues
          .map((issue) => [issue.field, issue.message].filter(Boolean).join(': '))
          .join(', ')

        return [body.message, details].filter(Boolean).join(' — ')
      }
    } catch {
      // Body was absent or not JSON — fall through to the status-only message.
    }

    return `HTTP ${status} error`
  }

  return {
    executeClone,
    processError,
  }
}
