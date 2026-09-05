import { APIError, CollectionBeforeChangeHook } from 'payload'

import { resolveUploadOrganisationId } from '@/payload/utilities/resolve-upload-organisation-id'

/**
 * Files an upload under a per-organisation folder, `<collection-slug>/<org-id>`,
 * which is the S3 key prefix the storage adapter writes to and the static
 * handler later reads back from.
 *
 * Three properties matter and all three are load-bearing (PIMS-88):
 *
 * 1. **It only assigns when a file is actually in flight.** After the object is
 *    in S3, `plugin-cloud-storage`'s `afterChange` hook re-saves the document
 *    with its own upload metadata, and that save re-enters every `beforeChange`
 *    hook. A save with no `req.file` must leave `data.prefix` alone — it still
 *    has to point at wherever the existing object lives, which is not
 *    necessarily what we would compute today (older documents sit under
 *    `documents/null`, and organisation membership can change).
 * 2. **The value is derived, not appended.** Building it from the collection
 *    slug makes the hook idempotent; appending to `data.prefix` grew a segment
 *    on every re-entry (`documents/18` → `documents/18/18`) and orphaned the
 *    document from its own object.
 * 3. **It refuses an upload it cannot file.** An unresolved organisation used to
 *    interpolate as the literal string `documents/null`, which mixed three parks
 *    into one folder. 188 rows landed there before this guard existed.
 *
 * The slug is the right base because `payload.config.ts` configures each of
 * these collections with `prefix: <Collection>.slug`.
 */
export const assignOrgToUploadBeforeChangeHook: CollectionBeforeChangeHook = async ({
  collection,
  context,
  data,
  originalDoc,
  req,
}) => {
  if (!req.file) {
    return data
  }

  const targetOrgId = resolveUploadOrganisationId({ context, data, originalDoc, req })

  if (targetOrgId === null) {
    throw new APIError(
      `Cannot store an upload in ${collection.slug}: no organisation resolved for it.`,
      400,
    )
  }

  data.prefix = `${collection.slug}/${targetOrgId}`

  return data
}
