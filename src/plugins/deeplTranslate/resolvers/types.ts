import type { PayloadRequest } from 'payload'

export type DeepLResolverArgs = {
  /** Locale to translate from */
  localeFrom: string
  /** Locale to translate to */
  localeTo: string
  req: PayloadRequest
  texts: string[]
}

export type DeepLResolverResponse =
  | {
      success: false
    }
  | {
      success: true
      translatedTexts: string[]
    }

export type DeepLResolver = {
  key: string
  resolve: (args: DeepLResolverArgs) => Promise<DeepLResolverResponse> | DeepLResolverResponse
}
