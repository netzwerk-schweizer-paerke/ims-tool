import type { CollectionSlug, GlobalSlug, PayloadRequest, TypedLocale, TypeWithID } from 'payload'

import { APIError } from 'payload'

type Args = {
  collectionSlug?: CollectionSlug
  context?: Record<string, unknown> // Add context for hooks
  data: Record<string, unknown>
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

  // The config registers no globals, so Payload resolves `GlobalSlug` to `never` and typing an
  // `updateGlobal` call here is impossible. Register a global, then restore that branch.
  if (globalSlug) {
    throw new APIError('Global translation is not configured', 400)
  }

  if (!id) {
    throw new APIError('Bad Request', 400)
  }

  const depth = incomingDepth ?? req.payload.config.defaultDepth

  const promise = req.payload.update({
    collection: collectionSlug as CollectionSlug,
    context,
    // The caller names its collection at run time. Payload then types `data` as the intersection
    // over every collection, which is `{ [key: string]: undefined }` and no document satisfies it.
    // One assertion is unavoidable while the slug stays the full union.
    data: data as unknown as Record<string, never>,
    depth,
    id,
    locale,
    overrideAccess,
    req,
  })

  // Payload types the collection result and the global result as unrelated unions, so neither is
  // comparable to the declared contract without a widening step first.
  return promise as unknown as Promise<Record<string, unknown> & TypeWithID>
}
