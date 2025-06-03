import type {
  CollectionSlug,
  GlobalSlug,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TypeWithID,
} from 'payload'
import { APIError } from 'payload'

type Args = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  locale: string
  overrideAccess?: boolean
  req: PayloadRequest
}

const findConfigBySlug = (
  slug: string,
  enities: SanitizedCollectionConfig[] | SanitizedGlobalConfig[],
) => enities.find((entity) => entity.slug === slug)

export const findEntityWithConfig = async (
  args: Args,
): Promise<{
  config: SanitizedCollectionConfig | SanitizedGlobalConfig
  doc: Record<string, unknown> & TypeWithID
}> => {
  const { id, collectionSlug, globalSlug, locale, overrideAccess, req } = args

  if (!collectionSlug && !globalSlug) {
    throw new APIError('Bad Request', 400)
  }

  const { payload } = req

  const { config } = payload

  const isGlobal = !!globalSlug

  if (!isGlobal && !id) {
    throw new APIError('Bad Request', 400)
  }

  const entityConfig = isGlobal
    ? findConfigBySlug(globalSlug, config.globals)
    : findConfigBySlug(collectionSlug as string, config.collections)

  if (!entityConfig) {
    throw new APIError('Bad Request', 400)
  }

  const doc = isGlobal
    ? await payload.findGlobal({
        slug: args.globalSlug as GlobalSlug,
        depth: 0,
        fallbackLocale: undefined,
        locale: locale as never,
        overrideAccess,
        req,
      })
    : await payload.findByID({
        id: id as number | string,
        collection: collectionSlug as CollectionSlug,
        depth: 0,
        fallbackLocale: undefined,
        locale: locale as never,
        overrideAccess,
        req,
      })

  return {
    config: entityConfig,
    doc: doc,
  }
}
