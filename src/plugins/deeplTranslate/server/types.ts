import { CollectionSlug, GlobalSlug, TypedLocale } from 'payload'

export type TranslateArgs = {
  collectionSlug?: CollectionSlug
  data?: Record<string, unknown>
  emptyOnly?: boolean
  globalSlug?: GlobalSlug
  id?: number | string
  /** active locale */
  locale: TypedLocale
  localeFrom: TypedLocale
  overrideAccess?: boolean
  update?: boolean
}

export type TranslateEndpointArgs = Omit<TranslateArgs, 'update'>

export type TranslateResult =
  | {
      error?: {
        details?: unknown
        message: string
        type: 'authentication' | 'generic' | 'network' | 'quota_exceeded'
      }
      success: false
    }
  | {
      success: true
      translatedData: Record<string, unknown>
    }

export type ValueToTranslate = {
  onTranslate: (translatedValue: string) => void
  value: string | undefined
}
