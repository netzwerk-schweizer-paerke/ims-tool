import type { PayloadRequest } from 'payload'

import * as deepl from 'deepl-node'

import { logger } from '@/lib/logger'

import type { DeepLResolver, DeepLResolverArgs } from './resolver-types'

export interface DeeplResolverConfig {
  apiKey: string
  chunkLength?: number
}

/** Narrows an unknown thrown value so the code can read a property off it. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const NETWORK_ERROR_CODES = new Set(['ECONNABORTED', 'ECONNREFUSED', 'ENOTFOUND'])

// Helper function to detect and categorize DeepL API errors
function categorizeDeepLError(error: unknown): {
  details?: unknown
  message: string
  type: 'authentication' | 'generic' | 'network' | 'quota_exceeded'
} {
  const status = isRecord(error) ? error.status : undefined
  const code = isRecord(error) ? error.code : undefined
  const rawMessage = isRecord(error) ? error.message : undefined
  const message = typeof rawMessage === 'string' ? rawMessage : undefined

  // Check for DeepL specific error types based on error status codes
  if (status && (typeof status === 'number' || typeof status === 'string')) {
    switch (status) {
      case 400: { // Bad request
        return {
          details: error,
          message: 'Invalid request to DeepL API.',
          type: 'generic',
        }
      }
      case 403: { // Forbidden/Authentication
        return {
          details: error,
          message: 'DeepL authentication failed. Please check your API key.',
          type: 'authentication',
        }
      }
      case 456: { // Quota exceeded
        return {
          details: error,
          message: 'Translation quota exceeded. Please check your DeepL account limits.',
          type: 'quota_exceeded',
        }
      }
      default: {
        return {
          details: error,
          message: 'DeepL API error occurred.',
          type: 'generic',
        }
      }
    }
  }

  // Check for network-related errors
  if (typeof code === 'string' && NETWORK_ERROR_CODES.has(code)) {
    return {
      details: error,
      message: 'Network error connecting to DeepL API.',
      type: 'network',
    }
  }

  // Check error message for quota-related keywords
  const errorMessage = message?.toLowerCase() || ''
  if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
    return {
      details: error,
      message: 'Translation quota exceeded. Please check your DeepL account limits.',
      type: 'quota_exceeded',
    }
  }

  // Default to generic error
  return {
    details: error,
    message: message || 'Unknown translation error occurred.',
    type: 'generic',
  }
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
  options?: deepl.TranslateTextOptions,
): Promise<string[]> {
  const results: string[] = []

  for (const chunk of chunks) {
    try {
      const chunkWithIndices = chunk.map((text, index) => ({ index, text }))

      const filteredChunk = chunkWithIndices.filter((item) => item.text.trim() !== '')
      const textsToTranslate = filteredChunk.map((item) => item.text)

      if (textsToTranslate.length === 0) {
        results.push(...chunk)
        continue
      }

      logger.debug({
        filteredSize: textsToTranslate.length,
        msg: 'Processing chunk',
        size: chunk.length,
      })

      const translationResults = (await translator.translateText(
        textsToTranslate,
        sourceLanguage,
        targetLanguage,
        options,
      )) as deepl.TextResult[]

      // Create a map of translations indexed by their original position
      const translatedMap = new Map<number, string>()
      for (const [i, item] of filteredChunk.entries()) {
        translatedMap.set(item.index, translationResults[i].text)
      }

      // Rebuild the result array with translations in original positions
      const chunkResults = chunk.map((text, index) => {
        return translatedMap.has(index) ? translatedMap.get(index)! : text
      })

      results.push(...chunkResults)
    } catch (error) {
      const categorizedError = categorizeDeepLError(error)

      logger.error({
        chunkSize: chunk.length,
        errorMessage: categorizedError.message,
        errorType: categorizedError.type,
        message: 'DeepL translation failed for chunk',
      })

      // A failed chunk fails the whole request. The earlier code pushed the source
      // strings, which wrote untranslated text into the target locale and marked it
      // up to date. Throw the original error, because the caller categorises it once.
      throw error
    }
  }

  return results
}

const deepLResolver = ({ apiKey, chunkLength = 100 }: DeeplResolverConfig): DeepLResolver => ({
  key: 'deepl',
  resolve: async (args: DeepLResolverArgs) => {
    const options: deepl.TranslatorOptions = {
      maxRetries: 10,
      minTimeout: 1000,
      sendPlatformInfo: false,
    }

    const DeepL = new deepl.Translator(apiKey, options)

    const {
      localeFrom,
      localeTo,
      options: translationOptions,
      req,
      texts,
    } = args as {
      localeFrom: deepl.SourceLanguageCode
      localeTo: deepl.TargetLanguageCode
      options?: deepl.TranslateTextOptions
      req: PayloadRequest
      texts: string[]
    }

    logger.debug({ entries: texts.length, localeFrom, localeTo, msg: 'DeepL resolver called' })

    const chunks = chunkArray(texts, chunkLength)

    try {
      const translatedTexts = await processChunksSequentially(
        chunks,
        DeepL,
        localeFrom,
        localeTo,
        req,
        translationOptions,
      )

      return {
        success: true,
        translatedTexts,
      }
    } catch (error) {
      const categorizedError = categorizeDeepLError(error)

      logger.error({
        entriesCount: texts.length,
        errorMessage: categorizedError.message,
        errorType: categorizedError.type,
        localeFrom,
        localeTo,
        msg: 'DeepL resolver failed',
      })

      return {
        error: categorizedError,
        success: false,
      }
    }
  },
})

export { deepLResolver }
