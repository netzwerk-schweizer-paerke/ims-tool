import type { PayloadRequest } from 'payload'

import * as deepl from 'deepl-node'

import type { DeepLResolver, DeepLResolverArgs } from './types'
import { logger } from '@/lib/logger'

export interface DeeplResolverConfig {
  apiKey: string
  chunkLength?: number
}

export const chunkArray = <T>(array: T[], length: number): T[][] => {
  return Array.from({ length: Math.ceil(array.length / length) }, (_, i) =>
    array.slice(i * length, i * length + length),
  )
}

/**
 * Processes chunks sequentially to ensure order is preserved
 * Each chunk is sent as a batch to DeepL rather than individual texts
 * Handles empty strings gracefully
 */
async function processChunksSequentially(
  chunks: string[][],
  translator: deepl.Translator,
  sourceLanguage: deepl.SourceLanguageCode,
  targetLanguage: deepl.TargetLanguageCode,
  req: PayloadRequest,
): Promise<string[]> {
  const results: string[] = []

  for (const chunk of chunks) {
    try {
      const chunkWithIndices = chunk.map((text, index) => ({ text, index }))

      const filteredChunk = chunkWithIndices.filter((item) => item.text.trim() !== '')
      const textsToTranslate = filteredChunk.map((item) => item.text)

      if (textsToTranslate.length === 0) {
        results.push(...chunk)
        continue
      }

      logger.debug({
        msg: 'Processing chunk',
        size: chunk.length,
        filteredSize: textsToTranslate.length,
      })

      const translationResults = (await translator.translateText(
        textsToTranslate,
        sourceLanguage,
        targetLanguage,
      )) as deepl.TextResult[]

      // Create a map of translations indexed by their original position
      const translatedMap = new Map<number, string>()
      filteredChunk.forEach((item, i) => {
        translatedMap.set(item.index, translationResults[i].text)
      })

      // Rebuild the result array with translations in original positions
      const chunkResults = chunk.map((text, index) => {
        return translatedMap.has(index) ? translatedMap.get(index)! : text
      })

      results.push(...chunkResults)
    } catch (error) {
      logger.error({
        error,
        message: 'DeepL translation failed for chunk',
        chunkSize: chunk.length,
        chunk,
      })

      // Return original texts for this chunk on error
      results.push(...chunk)
    }
  }

  return results
}

const deepLResolver = ({ apiKey, chunkLength = 100 }: DeeplResolverConfig): DeepLResolver => ({
  key: 'deepl',
  resolve: async (args: DeepLResolverArgs) => {
    const options: deepl.TranslatorOptions = {
      sendPlatformInfo: false,
      maxRetries: 10,
      minTimeout: 1000,
    }

    const DeepL = new deepl.Translator(apiKey, options)

    const { localeFrom, localeTo, req, texts } = args as {
      localeFrom: deepl.SourceLanguageCode
      localeTo: deepl.TargetLanguageCode
      req: PayloadRequest
      texts: string[]
    }

    logger.debug({ msg: 'DeepL resolver called', localeFrom, localeTo, entries: texts.length })

    const chunks = chunkArray(texts, chunkLength)

    const translatedTexts = await processChunksSequentially(
      chunks,
      DeepL,
      localeFrom,
      localeTo,
      req,
    )

    return {
      success: true,
      translatedTexts,
    }
  },
})

export { deepLResolver }
