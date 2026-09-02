import type { CollectionSlug, GlobalSlug, TypedLocale } from 'payload'

import ky from 'ky'

import type { TranslateErrorType, TranslateResult } from '../../translate-response-schema'

import { translateSuccessResponseSchema } from '../../translate-response-schema'

interface TranslateOptions {
  collectionSlug?: CollectionSlug
  fromLocale: TypedLocale
  globalSlug?: GlobalSlug
  id: number | string
  includeRelationships?: boolean
  relationshipDepth?: number
  toLocale: TypedLocale
}

/** The endpoint maps a resolver failure onto these statuses. */
const errorTypeForStatus = (status: number): TranslateErrorType => {
  switch (status) {
    case 401: {
      return 'authentication'
    }
    case 429: {
      return 'quota_exceeded'
    }
    case 502: {
      return 'network'
    }
    default: {
      return 'generic'
    }
  }
}

const messageForStatus = (status: number): string => {
  switch (status) {
    case 401: {
      return 'Authentication failed. Please check your API key.'
    }
    case 429: {
      return 'Translation quota exceeded. Please check your DeepL account limits.'
    }
    case 502: {
      return 'Network error occurred. Please try again.'
    }
    default: {
      return 'Translation failed'
    }
  }
}

export async function translateDocument(options: TranslateOptions): Promise<TranslateResult> {
  try {
    const body = await ky
      .post('/api/deepltranslate/translate', {
        credentials: 'include',
        json: options,
        timeout: 60_000, // 60 second timeout for large translations
      })
      .json<unknown>()

    // The wire response is untyped. Parse it, because a cast would hide a server-side
    // shape change until a component read undefined.
    const parsed = translateSuccessResponseSchema.safeParse(body)

    if (!parsed.success) {
      console.error('Translation response did not match the schema:', parsed.error.issues)
      return {
        error: 'The server returned an unexpected response.',
        errorType: 'generic',
        success: false,
      }
    }

    return { data: parsed.data, success: true }
  } catch (error) {
    console.error('Translation failed:', error)

    // Handle HTTP errors with structured response
    if (error && typeof error === 'object' && 'response' in error) {
      const httpError = error as { response: Response }
      const errorType = errorTypeForStatus(httpError.response.status)

      try {
        const errorData = (await httpError.response.json()) as {
          errors?: { message?: string }[]
          message?: string
        }

        return {
          // A Payload APIError serialises as { errors: [{ message }] }, never as a top-level
          // message. Read both shapes, or an access denial reads as a generic failure.
          error: errorData.message || errorData.errors?.[0]?.message || 'Translation failed',
          errorType,
          success: false,
        }
      } catch {
        // If we can't parse the error response, fall back to status-based error
        return {
          error: messageForStatus(httpError.response.status),
          errorType,
          success: false,
        }
      }
    }

    return {
      error: error instanceof Error ? error.message : 'Translation failed',
      errorType: 'generic',
      success: false,
    }
  }
}
