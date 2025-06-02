import type { PayloadRequest } from 'payload'

import * as deepl from 'deepl-node'

import type { DeepLResolver, DeepLResolverArgs } from './types'

export interface DeeplResolverConfig {
  apiKey: string
  chunkLength?: number
}

export const chunkArray = <T>(array: T[], length: number): T[][] => {
  return Array.from({ length: Math.ceil(array.length / length) }, (_, i) =>
    array.slice(i * length, i * length + length),
  )
}

const deepLResolver = ({ apiKey, chunkLength = 100 }: DeeplResolverConfig): DeepLResolver => ({
  key: 'deepl',
  resolve: async (args: DeepLResolverArgs) => {
    const deepltranslate = new deepl.Translator(apiKey)

    const { localeFrom, localeTo, req, texts } = args as {
      localeFrom: deepl.SourceLanguageCode
      localeTo: deepl.TargetLanguageCode
      req: PayloadRequest
      texts: string[]
    }

    const translatedTexts = await Promise.all(
      chunkArray(texts, chunkLength).map(async (q) => {
        return await Promise.all(
          q.map(async (text) => {
            try {
              const result = await deepltranslate.translateText(text, localeFrom, localeTo)
              return result.text
            } catch (error) {
              req.payload.logger.error({
                error,
                message: 'Deepl is not responding.',
              })

              return text
            }
          }),
        )
      }),
    )

    return {
      success: true,
      translatedTexts: translatedTexts.flat(),
    }
  },
})

export { deepLResolver }
