import { CollectionSlug, GlobalSlug, TypedLocale } from 'payload'

export type ValueToTranslate = {
  onTranslate: (translatedValue: string) => void
  value: string | undefined
}

export type TranslateArgs = {
  collectionSlug?: CollectionSlug
  data?: Record<string, any>
  emptyOnly?: boolean
  globalSlug?: GlobalSlug
  id?: number | string
  /** active locale */
  locale: TypedLocale
  localeFrom: TypedLocale
  overrideAccess?: boolean
  update?: boolean
}

export type TranslateResult =
  | {
      success: false
      error?: {
        type: 'quota_exceeded' | 'generic' | 'network' | 'authentication'
        message: string
        details?: any
      }
    }
  | {
      success: true
      translatedData: Record<string, any>
    }

export type TranslateEndpointArgs = Omit<TranslateArgs, 'update'>
