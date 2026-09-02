import he from 'he'
import {
  APIError,
  type CollectionSlug,
  type GlobalSlug,
  type Payload,
  type PayloadRequest,
  type TypedLocale,
} from 'payload'

import type { TranslateArgs, TranslateResult, ValueToTranslate } from '../types'

import { deepLResolver } from '../services/deepl-resolver'
import { findEntityWithConfig } from '../utilities/find-entity-with-config'
import { traverseFields } from '../utilities/traverse-fields'
import { updateEntity } from './update-entity'
// Removed translateRelationships - now handled by the endpoint with collector

export type TranslateOperationArgs = Omit<TranslateArgs, 'resolver'> &
  {
    includeRelationships?: boolean
    relationshipDepth?: number
  } & (
  | {
      payload: Payload
    }
  | {
      req: PayloadRequest
    }
)

export type WriteTranslationArgs = {
  collectionSlug?: CollectionSlug
  globalSlug?: GlobalSlug
  id?: number | string
  locale: TypedLocale
  localeFrom: TypedLocale
  overrideAccess?: boolean
  req: PayloadRequest
  translatedData: Record<string, unknown>
}

/**
 * Writes one already-translated document into the target locale.
 *
 * The endpoint calls this inside its transaction, after every DeepL call has finished.
 * Keeping the write separate stops the transaction from staying open across the network.
 */
export const writeTranslation = async (args: WriteTranslationArgs): Promise<void> => {
  const { collectionSlug, globalSlug, id, locale, localeFrom, overrideAccess, req, translatedData } =
    args

  // Preserve the translationMeta field if it exists
  const metaFieldName =
    req.payload.config.custom?.deepltranslate?.trackOutdated?.fieldName || 'translationMeta'

  // Fetch the current document to get existing metadata
  let existingMeta = null
  try {
    const { doc: currentDoc } = await findEntityWithConfig({
      collectionSlug,
      depth: 0,
      globalSlug,
      id,
      locale,
      overrideAccess,
      req,
    })
    existingMeta = currentDoc?.[metaFieldName]
  } catch {
    // Document might not exist in target locale yet
  }

  // Include existing metadata in the update
  if (existingMeta) {
    translatedData[metaFieldName] = existingMeta
  }

  await updateEntity({
    collectionSlug,
    context: {
      fromLocale: localeFrom,
      isTranslation: true,
    },
    data: translatedData,
    depth: 0,
    globalSlug,
    id,
    locale,
    overrideAccess,
    req,
  })
}

export const translateOperation = async (args: TranslateOperationArgs) => {
  const req: PayloadRequest =
    'req' in args
      ? args.req
      : ({
          payload: args.payload,
        } as PayloadRequest)

  const { collectionSlug, globalSlug, id, locale, localeFrom, overrideAccess } = args

  const { config, doc: dataFrom } = await findEntityWithConfig({
    collectionSlug,
    depth: 0, // Use depth 0 to avoid populating document references in Lexical links
    globalSlug,
    id,
    locale: localeFrom,
    req,
    // We don't need populated data for translation, just IDs
  })

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
        collectionSlug,
        globalSlug,
        id,
        locale,
        overrideAccess,
        req,
      })
      translatedData = doc
    } catch {
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

  if (resolveResult.success) {
    for (const [index, translated] of resolveResult.translatedTexts.entries()) {
      const formattedValue = he.decode(translated)

      valuesToTranslate[index].onTranslate(formattedValue)
    }

    if (args.update) {
      await writeTranslation({
        collectionSlug,
        globalSlug,
        id,
        locale,
        localeFrom,
        overrideAccess,
        req,
        translatedData,
      })
    }

    result = {
      success: true,
      translatedData,
    }
  } else {
    result = {
      error: resolveResult.error,
      success: false,
    }
  }

  return result
}
