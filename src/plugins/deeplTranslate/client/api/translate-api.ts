import type { CollectionSlug, GlobalSlug, TypedLocale } from 'payload'

import ky from 'ky'

interface TranslateOptions {
  collectionSlug?: CollectionSlug
  fromLocale: TypedLocale
  globalSlug?: GlobalSlug
  id: number | string
  includeRelationships?: boolean
  relationshipDepth?: number
  toLocale: TypedLocale
}

interface TranslateResponse {
  collection?: string
  error?: string
  errorType?: 'authentication' | 'generic' | 'network' | 'quota_exceeded'
  id?: number | string
  message?: string
  success: boolean
}

export async function translateDocument(options: TranslateOptions): Promise<TranslateResponse> {
  try {
    const response = await ky
      .post('/api/deepltranslate/translate', {
        credentials: 'include',
        json: options,
        timeout: 60_000, // 60 second timeout for large translations
      })
      .json<TranslateResponse>()

    return response
  } catch (error) {
    console.error('Translation failed:', error)

    // Handle HTTP errors with structured response
    if (error && typeof error === 'object' && 'response' in error) {
      const httpError = error as { response: Response }

      try {
        // Try to parse the error response as JSON
        const errorData = await httpError.response.json()

        // Determine error type based on HTTP status code
        let errorType: 'authentication' | 'generic' | 'network' | 'quota_exceeded'
        switch (httpError.response.status) {
          case 401: {
            errorType = 'authentication'
            break
          }
          case 429: {
            errorType = 'quota_exceeded'
            break
          }
          case 502: {
            errorType = 'network'
            break
          }
          default: {
            errorType = 'generic'
          }
        }

        return {
          error: errorData.message || 'Translation failed',
          errorType,
          success: false,
        }
      } catch {
        // If we can't parse the error response, fall back to status-based error
        let errorType: 'authentication' | 'generic' | 'network' | 'quota_exceeded'
        let errorMessage: string

        switch (httpError.response.status) {
          case 401: {
            errorType = 'authentication'
            errorMessage = 'Authentication failed. Please check your API key.'
            break
          }
          case 429: {
            errorType = 'quota_exceeded'
            errorMessage = 'Translation quota exceeded. Please check your DeepL account limits.'
            break
          }
          case 502: {
            errorType = 'network'
            errorMessage = 'Network error occurred. Please try again.'
            break
          }
          default: {
            errorType = 'generic'
            errorMessage = 'Translation failed'
          }
        }

        return {
          error: errorMessage,
          errorType,
          success: false,
        }
      }
    }

    // Handle other types of errors
    if (error instanceof Error) {
      return {
        error: error.message,
        errorType: 'generic',
        success: false,
      }
    }

    return {
      error: 'Translation failed',
      errorType: 'generic',
      success: false,
    }
  }
}
