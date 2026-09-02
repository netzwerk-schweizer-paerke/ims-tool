import type { PayloadRequest } from 'payload'

export type DeepLResolver = {
  key: string
  resolve: (args: DeepLResolverArgs) => DeepLResolverResponse | Promise<DeepLResolverResponse>
}

export type DeepLResolverArgs = {
  /** Locale to translate from */
  localeFrom: string
  /** Locale to translate to */
  localeTo: string
  /** Optional DeepL API options (e.g., tag_handling for HTML) */
  options?: Record<string, unknown>
  req: PayloadRequest
  texts: string[]
}

export type DeepLResolverResponse =
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
      translatedTexts: string[]
    }
