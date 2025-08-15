import type { PayloadRequest } from 'payload'

import * as deepl from 'deepl-node'

import type { DeepLResolver, DeepLResolverArgs } from './resolver-types'
import { logger } from '@/lib/logger'

// Helper function to detect and categorize DeepL API errors
function categorizeDeepLError(error: any): { type: 'quota_exceeded' | 'generic' | 'network' | 'authentication', message: string, details?: any } {
  // Check for DeepL specific error types based on error status codes
  if (error?.status) {
    switch (error.status) {
      case 456: // Quota exceeded
        return {
          type: 'quota_exceeded',
          message: 'Translation quota exceeded. Please check your DeepL account limits.',
          details: error
        }
      case 403: // Forbidden/Authentication
        return {
          type: 'authentication',
          message: 'DeepL authentication failed. Please check your API key.',
          details: error
        }
      case 400: // Bad request
        return {
          type: 'generic',
          message: 'Invalid request to DeepL API.',
          details: error
        }
      default:
        return {
          type: 'generic',
          message: 'DeepL API error occurred.',
          details: error
        }
    }
  }
  
  // Check for network-related errors
  if (error?.code === 'ECONNABORTED' || error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
    return {
      type: 'network',
      message: 'Network error connecting to DeepL API.',
      details: error
    }
  }
  
  // Check error message for quota-related keywords
  const errorMessage = error?.message?.toLowerCase() || ''
  if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
    return {
      type: 'quota_exceeded',
      message: 'Translation quota exceeded. Please check your DeepL account limits.',
      details: error
    }
  }
  
  // Default to generic error
  return {
    type: 'generic',
    message: error?.message || 'Unknown translation error occurred.',
    details: error
  }
}

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
  options?: any,
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
        options,
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
      const categorizedError = categorizeDeepLError(error)
      
      logger.error({
        error,
        message: 'DeepL translation failed for chunk',
        chunkSize: chunk.length,
        chunk,
        errorType: categorizedError.type,
        errorMessage: categorizedError.message,
      })

      // For quota exceeded errors, we should propagate the error instead of continuing
      if (categorizedError.type === 'quota_exceeded') {
        throw categorizedError
      }

      // For other errors, return original texts for this chunk
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

    const {
      localeFrom,
      localeTo,
      req,
      texts,
      options: translationOptions,
    } = args as {
      localeFrom: deepl.SourceLanguageCode
      localeTo: deepl.TargetLanguageCode
      req: PayloadRequest
      texts: string[]
      options?: any
    }

    logger.debug({ msg: 'DeepL resolver called', localeFrom, localeTo, entries: texts.length })

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
        msg: 'DeepL resolver failed',
        localeFrom,
        localeTo,
        entriesCount: texts.length,
        errorType: categorizedError.type,
        errorMessage: categorizedError.message,
      })

      return {
        success: false,
        error: categorizedError,
      }
    }
  },
})

export { deepLResolver }
