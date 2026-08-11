import type { CollectionSlug, GlobalSlug, PayloadRequest, TypedLocale, TypeWithID } from 'payload'

import { APIError } from 'payload'

type Args = {
  collectionSlug?: CollectionSlug
  context?: Record<string, any> // Add context for hooks
  data: Record<string, any>
  depth?: number
  globalSlug?: GlobalSlug
  id?: number | string
  locale: TypedLocale
  overrideAccess?: boolean
  req: PayloadRequest
}

export const updateEntity = ({
  collectionSlug,
  context,
  data,
  depth: incomingDepth,
  globalSlug,
  id,
  locale,
  overrideAccess,
  req,
}: Args): Promise<Record<string, unknown> & TypeWithID> => {
  if (!collectionSlug && !globalSlug) {
    throw new APIError('Bad Request', 400)
  }

  const isGlobal = !!globalSlug

  if (!isGlobal && !id) {
    throw new APIError('Bad Request', 400)
  }

  const depth = incomingDepth ?? req.payload.config.defaultDepth

  const currentSlug = isGlobal ? globalSlug : collectionSlug

  const promise = isGlobal
    ? req.payload.updateGlobal({
        context,
        data,
        depth,
        locale: locale as any,
        overrideAccess,
        req,
        slug: currentSlug as GlobalSlug,
      })
    : req.payload.update({
        collection: currentSlug as CollectionSlug,
        context,
        data,
        depth,
        id: id as number | string,
        locale: locale as any,
        overrideAccess,
        req,
      })

  return promise as any
}
