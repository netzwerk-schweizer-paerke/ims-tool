import he from 'he'
import { APIError, type Payload, type PayloadRequest } from 'payload'
import type { TranslateArgs, TranslateResult, ValueToTranslate } from './types'

import { findEntityWithConfig } from './findEntityWithConfig'
import { traverseFields } from './traverseFields'
import { updateEntity } from './updateEntity'
import { deepLResolver } from '@/plugins/deeplTranslate/resolvers/deepl'
import { extractTranslationData } from './extractTranslationData'

export type TranslateOperationArgs = (
  | {
      payload: Payload
    }
  | {
      req: PayloadRequest
    }
) &
  Omit<TranslateArgs, 'resolver'>

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
    const { doc } = await findEntityWithConfig({
      id,
      collectionSlug,
      globalSlug,
      locale,
      overrideAccess,
      req,
    })

    translatedData = doc
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
    texts: valuesToTranslate.map((each) => each.value),
  })

  let result: TranslateResult

  if (!resolveResult.success) {
    result = {
      success: false,
    }
  } else {
    resolveResult.translatedTexts.forEach((translated, index) => {
      const formattedValue = he.decode(translated)

      valuesToTranslate[index].onTranslate(formattedValue)
    })

    if (args.update) {
      await updateEntity({
        id,
        collectionSlug,
        data: translatedData,
        depth: 0,
        globalSlug,
        locale,
        overrideAccess,
        req,
      })
    }

    result = {
      success: true,
      translatedData,
    }
  }

  return result
}
