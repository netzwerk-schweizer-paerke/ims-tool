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

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Translation failed',
    }
  }
}
