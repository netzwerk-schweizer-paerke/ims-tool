import type { PayloadHandler } from 'payload'
import { APIError } from 'payload'

import type { TranslateEndpointArgs } from './types'

import { translateOperation } from './operation'

export const translateEndpoint: PayloadHandler = async (req) => {
  if (!req.json) {
    throw new APIError('Content-Type should be json')
  }

  const args: TranslateEndpointArgs = await req.json()

  const { id, collectionSlug, data, emptyOnly, globalSlug, locale, localeFrom } = args

  const result = await translateOperation({
    id,
    collectionSlug,
    data,
    emptyOnly,
    globalSlug,
    locale,
    localeFrom,
    overrideAccess: false,
    req,
    update: false,
  })

  return Response.json(result)
}
