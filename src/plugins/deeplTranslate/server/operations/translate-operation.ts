import he from 'he'
import { APIError, type Payload, type PayloadRequest } from 'payload'
import type { TranslateArgs, TranslateResult, ValueToTranslate } from '../types'

import { findEntityWithConfig } from '../utilities/find-entity-with-config'
import { traverseFields } from '../utilities/traverse-fields'
import { updateEntity } from './update-entity'
import { deepLResolver } from '../services/deepl-resolver'
import { extractTranslationData } from '../utilities/extract-translation-data'
// Removed translateRelationships - now handled by the endpoint with collector

export type TranslateOperationArgs = (
  | {
      payload: Payload
    }
  | {
      req: PayloadRequest
    }
) &
  Omit<TranslateArgs, 'resolver'> & {
    includeRelationships?: boolean
    relationshipDepth?: number
  }

export const translateOperation = async (args: TranslateOperationArgs) => {
  const req: PayloadRequest =
    'req' in args
      ? args.req
      : ({
          payload: args.payload,
        } as PayloadRequest)

  const { id, collectionSlug, globalSlug, locale, localeFrom, overrideAccess } = args

  const { config, doc: dataFrom } = await findEntityWithConfig({
    id,
    collectionSlug,
    globalSlug,
    locale: localeFrom,
    req,
    depth: 0, // Use depth 0 to avoid populating document references in Lexical links
    // We don't need populated data for translation, just IDs
  })

  extractTranslationData(dataFrom, config.fields)

  const resolver = deepLResolver({
    apiKey: req.payload.config.custom?.deepltranslate.apiKey,
  })

  if (!resolver) {
    throw new APIError('DeepL resolver not found')
  }

  const valuesToTranslate: ValueToTranslate[] = []

  let translatedData = args.data

  if (!translatedData) {
    try {
      const { doc } = await findEntityWithConfig({
        id,
        collectionSlug,
        globalSlug,
        locale,
        overrideAccess,
        req,
      })
      translatedData = doc
    } catch (error) {
      // If document doesn't exist in target locale, use an empty object
      // The document will be created when we call updateEntity
      translatedData = {}
    }
  }

  traverseFields({
    dataFrom,
    emptyOnly: args.emptyOnly,
    fields: config.fields,
    translatedData,
    valuesToTranslate,
  })

  const resolveResult = await resolver.resolve({
    localeFrom: args.localeFrom,
    localeTo: args.locale,
    req,
    texts: valuesToTranslate.map((each) => each.value).filter((v): v is string => v !== undefined),
  })

  let result: TranslateResult

  if (!resolveResult.success) {
    result = {
      success: false,
      error: resolveResult.error,
    }
  } else {
    resolveResult.translatedTexts.forEach((translated, index) => {
      const formattedValue = he.decode(translated)

      valuesToTranslate[index].onTranslate(formattedValue)
    })

    if (args.update) {
      // Preserve the translationMeta field if it exists
      const metaFieldName =
        req.payload.config.custom?.deepltranslate?.trackOutdated?.fieldName || 'translationMeta'

      // Fetch the current document to get existing metadata
      let existingMeta = null
      try {
        const { doc: currentDoc } = await findEntityWithConfig({
          id,
          collectionSlug,
          globalSlug,
          locale,
          overrideAccess,
          req,
          depth: 0,
        })
        existingMeta = currentDoc?.[metaFieldName]
      } catch (e) {
        // Document might not exist in target locale yet
      }

      // Include existing metadata in the update
      if (existingMeta) {
        translatedData[metaFieldName] = existingMeta
      }

      await updateEntity({
        id,
        collectionSlug,
        data: translatedData,
        depth: 0,
        globalSlug,
        locale,
        overrideAccess,
        req,
        context: {
          isTranslation: true,
          fromLocale: localeFrom,
        },
      })

      // Relationship translations are now handled in the endpoint using the collector pattern
    }

    result = {
      success: true,
      translatedData,
    }
  }

  return result
}
