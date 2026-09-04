/**
 * Two guards against a deletion driven by a broken orphan scan.
 *
 * Measured on the dev bucket on 2026-09-05: 1777 objects, 942 collected references, 1777
 * reported orphans. `extractS3Key` builds a reference key from `doc.url`, which never matches
 * a bucket key. See `.claude/rules/project/pitfalls/s3-orphan-detector-flags-every-object.md`.
 */

/**
 * The delete action is built and disarmed.
 *
 * `POST /api/s3-orphan-delete` is not registered in `src/payload.config.ts` while the scan is
 * broken. Restore both together, after the scan is repaired and re-measured.
 */
export const ORPHAN_DELETE_ENABLED = false

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
