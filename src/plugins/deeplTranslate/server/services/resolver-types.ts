import type { PayloadRequest } from 'payload'

export type DeepLResolverArgs = {
  /** Locale to translate from */
  localeFrom: string
  /** Locale to translate to */
  localeTo: string
  req: PayloadRequest
  texts: string[]
  /** Optional DeepL API options (e.g., tag_handling for HTML) */
  options?: any
}

export type DeepLResolverResponse =
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
      translatedTexts: string[]
    }

export type DeepLResolver = {
  key: string
  resolve: (args: DeepLResolverArgs) => Promise<DeepLResolverResponse> | DeepLResolverResponse
}
