/**
 * Refuse a deletion that covers every object in the bucket.
 *
 * A sweep that flags all of them has not found that every file is unused. It has failed to
 * build the reference set, and a delete on that answer empties the bucket. Measured on the
 * dev bucket on 2026-09-05: 1777 objects, 942 referenced files, 1777 reported orphans.
 */
export const coversWholeBucket = (deletableCount: number, bucketObjectCount: number): boolean =>
  bucketObjectCount > 0 && deletableCount >= bucketObjectCount
