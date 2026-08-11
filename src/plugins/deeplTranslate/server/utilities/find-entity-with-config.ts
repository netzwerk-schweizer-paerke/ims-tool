import type {
  CollectionSlug,
  GlobalSlug,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TypedLocale,
  TypeWithID,
} from 'payload'

import { APIError } from 'payload'

type Args = {
  collectionSlug?: CollectionSlug
  depth?: number
  globalSlug?: GlobalSlug
  id?: number | string
  locale: TypedLocale
  overrideAccess?: boolean
  req: PayloadRequest
}

const findConfigBySlug = (
  slug: CollectionSlug | GlobalSlug,
  enities: SanitizedCollectionConfig[] | SanitizedGlobalConfig[],
) => enities.find((entity) => entity.slug === slug)

export const findEntityWithConfig = async (
  args: Args,
): Promise<{
  config: SanitizedCollectionConfig | SanitizedGlobalConfig
  doc: Record<string, unknown> & TypeWithID
}> => {
  const { collectionSlug, depth = 0, globalSlug, id, locale, overrideAccess, req } = args

  if (!collectionSlug && !globalSlug) {
    throw new APIError('Bad Request', 400)
  }

  const { payload } = req

  const { config } = payload

  const isGlobal = !!globalSlug

  if (!isGlobal && !id) {
    throw new APIError('Bad Request', 400)
  }

  // Type guard for slug to avoid type errors
  const currentSlug = isGlobal ? globalSlug : collectionSlug

  // Safe cast using the type guard
  const entityConfig = isGlobal
    ? findConfigBySlug(currentSlug as GlobalSlug, config.globals)
    : findConfigBySlug(currentSlug as CollectionSlug, config.collections)

  if (!entityConfig) {
    throw new APIError('Bad Request', 400)
  }

  const doc = isGlobal
    ? await payload.findGlobal({
        depth,
        fallbackLocale: undefined,
        locale,
        overrideAccess,
        req,
        slug: args.globalSlug as GlobalSlug,
      })
    : await payload.findByID({
        collection: collectionSlug as CollectionSlug,
        depth,
        fallbackLocale: undefined,
        id: id as number | string,
        locale,
        overrideAccess,
        req,
      })

  return {
    config: entityConfig,
    doc: doc as unknown as Record<string, unknown> & TypeWithID,
  }
}
