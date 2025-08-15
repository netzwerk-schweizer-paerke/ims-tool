import ky from 'ky'
import type { CollectionSlug, GlobalSlug, TypedLocale } from 'payload'

interface TranslateOptions {
  id: string | number
  collectionSlug?: CollectionSlug
  globalSlug?: GlobalSlug
  fromLocale: TypedLocale
  toLocale: TypedLocale
  includeRelationships?: boolean
  relationshipDepth?: number
}

interface TranslateResponse {
  success: boolean
  message?: string
  id?: string | number
  collection?: string
  error?: string
  errorType?: 'quota_exceeded' | 'generic' | 'network' | 'authentication'
}

export async function translateDocument(options: TranslateOptions): Promise<TranslateResponse> {
  try {
    const response = await ky
      .post('/api/deepltranslate/translate', {
        json: options,
        credentials: 'include',
        timeout: 60000, // 60 second timeout for large translations
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
        let errorType: 'quota_exceeded' | 'generic' | 'network' | 'authentication'
        switch (httpError.response.status) {
          case 429:
            errorType = 'quota_exceeded'
            break
          case 401:
            errorType = 'authentication'
            break
          case 502:
            errorType = 'network'
            break
          default:
            errorType = 'generic'
        }
        
        return {
          success: false,
          error: errorData.message || 'Translation failed',
          errorType,
        }
      } catch (parseError) {
        // If we can't parse the error response, fall back to status-based error
        let errorType: 'quota_exceeded' | 'generic' | 'network' | 'authentication'
        let errorMessage: string
        
        switch (httpError.response.status) {
          case 429:
            errorType = 'quota_exceeded'
            errorMessage = 'Translation quota exceeded. Please check your DeepL account limits.'
            break
          case 401:
            errorType = 'authentication'
            errorMessage = 'Authentication failed. Please check your API key.'
            break
          case 502:
            errorType = 'network'
            errorMessage = 'Network error occurred. Please try again.'
            break
          default:
            errorType = 'generic'
            errorMessage = 'Translation failed'
        }
        
        return {
          success: false,
          error: errorMessage,
          errorType,
        }
      }
    }

    // Handle other types of errors
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        errorType: 'generic',
      }
    }

    return {
      success: false,
      error: 'Translation failed',
      errorType: 'generic',
    }
  }
}
