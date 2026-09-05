/**
 * Two guards against a deletion driven by a broken orphan scan.
 *
 * Measured on the dev bucket on 2026-09-05: 1777 objects, 942 collected references, 1777
 * reported orphans. `extractS3Key` builds a reference key from `doc.url`, which never matches
 * a bucket key. See `.claude/rules/project/pitfalls/s3-orphan-detector-flags-every-object.md`.
 */

/**
 * The master switch for the delete action.
 *
 * Set it to false, and unregister `s3OrphanDeleteEndpoint` in `src/payload.config.ts`, whenever
 * the scan is in doubt. Measured on 2026-09-05: 1777 objects, 1562 matched, 215 orphans.
 */
export const ORPHAN_DELETE_ENABLED = true

/**
 * An object younger than this is never a settled orphan.
 *
 * The scan lists the bucket and reads the rows at two different moments. An upload that lands
 * between them has an object and no row yet, so it reads as an orphan.
 */
export const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000

/**
 * Refuse one object that the bucket wrote too recently.
 *
 * The caller passes `now` so the test stays pure and the whole request uses one clock reading.
 */
export const isTooRecentToDelete = (lastModified: Date, now: Date): boolean =>
  now.getTime() - lastModified.getTime() < ORPHAN_MIN_AGE_MS

/**
 * Refuse a single request that covers every object in the bucket.
 *
 * This catches the obvious case. It does not catch a caller who deletes in chunks, which is
 * why `referenceScanFailed` is the primary guard.
 */
export const coversWholeBucket = (deletableCount: number, bucketObjectCount: number): boolean =>
  bucketObjectCount > 0 && deletableCount >= bucketObjectCount

/**
 * Refuse every deletion when the scan collected references and matched none of them.
 *
 * The size of the request does not enter this test, so a chunked request cannot walk past it.
 * A repository that holds references must match at least one object; zero matches means the
 * key builder failed, never that every stored file is unused.
 */
export const referenceScanFailed = (
  matchedReferenceCount: number,
  collectedReferenceCount: number,
): boolean => collectedReferenceCount > 0 && matchedReferenceCount === 0
