/**
 * Moves every upload whose S3 prefix does not name its own organisation.
 *
 * Two defects put objects in the wrong folder. `assignOrgToUploadBeforeChangeHook` used to append
 * `/<org-id>` on every save, which produced `documents/11/11/11`. It also interpolated an
 * unresolved organisation as the literal string `null`, which produced `documents/null`.
 *
 * Both leave a reachable file, because the static handler reads the prefix back from the row.
 * The S3 layout no longer matches the park, and `TenantHealthChecker` reports
 * `prefixOrganisationMismatch` for every one.
 *
 * The order per row is copy, verify, update the row, delete the old object. An interruption
 * therefore leaves an orphan object and never a dead link.
 *
 * Dry run by default. Pass --apply to write.
 *
 *   yarn tsx src/scripts/move-upload-prefixes.ts
 *   yarn tsx src/scripts/move-upload-prefixes.ts --apply
 */
/* eslint-disable unicorn/no-process-exit -- CLI entry point: the exit code is the result. */
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import { CollectionSlug, getPayload } from 'payload'

dotenv.config()

/** Collections whose objects are filed under a per-organisation prefix. */
const COLLECTIONS: CollectionSlug[] = ['documents', 'media']

interface Move {
  collection: CollectionSlug
  id: number | string
  /** Every key the row claims, paired with where that key must end up. */
  keys: { source: string; target: string }[]
  targetPrefix: string
  updatedAt: string
}

interface Refusal {
  collection: CollectionSlug
  id: number | string
  reason: string
}

/** The stored shape this script reads. Payload's own type is far wider. */
interface StoredUpload {
  filename?: null | string
  id: number | string
  organisation?: null | number | { id?: number }
  prefix?: null | string
  sizes?: null | Record<string, null | { filename?: null | string }>
  updatedAt?: string
}

const listAllKeys = async (client: S3Client, bucket: string): Promise<Set<string>> => {
  const keys = new Set<string>()
  let continuationToken: string | undefined

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    )
    for (const object of page.Contents ?? []) {
      if (object.Key) keys.add(object.Key)
    }
    continuationToken = page.NextContinuationToken
  } while (continuationToken)

  return keys
}

/**
 * Builds the `x-amz-copy-source` value.
 *
 * The header carries `<bucket>/<key>` and the key must be URL-encoded. Each segment is encoded on
 * its own, so the separators stay literal. Verified against garage v2.2.0 on 2026-09-05.
 */
const copySourceOf = (bucket: string, key: string): string =>
  `${bucket}/${key.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`

const organisationIdOf = (doc: StoredUpload): null | number => {
  const value = typeof doc.organisation === 'object' ? doc.organisation?.id : doc.organisation
  return typeof value === 'number' ? value : null
}

/** The row's own filename plus one per size variant. Media declares variants; documents does not. */
const filenamesOf = (doc: StoredUpload): string[] => {
  const filenames = doc.filename ? [doc.filename] : []

  for (const variant of Object.values(doc.sizes ?? {})) {
    if (variant?.filename) filenames.push(variant.filename)
  }

  return filenames
}

const plan = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  bucketKeys: Set<string>,
): Promise<{ moves: Move[]; refusals: Refusal[]; scanned: number }> => {
  const moves: Move[] = []
  const refusals: Refusal[] = []
  let scanned = 0

  for (const collection of COLLECTIONS) {
    const result = await payload.find({
      collection,
      depth: 0,
      limit: 0,
      overrideAccess: true,
      pagination: false,
    })

    for (const doc of result.docs as unknown as StoredUpload[]) {
      scanned += 1

      const organisationId = organisationIdOf(doc)
      const prefix = doc.prefix ?? ''

      // A row with no organisation is the shape this repair exists to prevent, so it is named
      // rather than skipped. `TenantHealthChecker` passes over it too, because it owns no park.
      if (organisationId === null) {
        if (prefix) {
          refusals.push({ collection, id: doc.id, reason: `the row names no organisation` })
        }
        continue
      }

      const targetPrefix = `${collection}/${organisationId}`

      if (!prefix || prefix === targetPrefix) continue

      const filenames = filenamesOf(doc)

      if (filenames.length === 0) {
        refusals.push({ collection, id: doc.id, reason: 'the row names no file' })
        continue
      }

      const keys = filenames.map((filename) => ({
        source: `${prefix}/${filename}`,
        target: `${targetPrefix}/${filename}`,
      }))
      const absent = keys.filter((key) => !bucketKeys.has(key.source))
      const occupied = keys.filter((key) => bucketKeys.has(key.target))

      if (absent.length > 0) {
        refusals.push({
          collection,
          id: doc.id,
          reason: `the bucket holds no object at ${absent.map((key) => key.source).join(', ')}`,
        })
        continue
      }

      if (occupied.length > 0) {
        refusals.push({
          collection,
          id: doc.id,
          reason: `an object already sits at ${occupied.map((key) => key.target).join(', ')}`,
        })
        continue
      }

      moves.push({ collection, id: doc.id, keys, targetPrefix, updatedAt: doc.updatedAt ?? '' })
    }
  }

  return { moves, refusals, scanned }
}

const apply = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  client: S3Client,
  bucket: string,
  moves: Move[],
): Promise<{ failures: Refusal[]; moved: number }> => {
  const failures: Refusal[] = []
  let moved = 0

  for (const move of moves) {
    const copied: string[] = []

    try {
      for (const key of move.keys) {
        await client.send(
          new CopyObjectCommand({
            Bucket: bucket,
            CopySource: copySourceOf(bucket, key.source),
            Key: key.target,
          }),
        )
        // A copy that did not land must never reach the row update, or the link dies.
        await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key.target }))
        copied.push(key.target)
      }

      // The adapter write skips every collection hook, and it carries the stored `updatedAt`
      // through. A moved row therefore does not read as edited today.
      await payload.db.updateOne({
        collection: move.collection,
        data: { prefix: move.targetPrefix, updatedAt: move.updatedAt },
        id: move.id,
      })
    } catch (error) {
      // A media row claims one key per size variant. A half-copied row would refuse itself on the
      // next run with "an object already sits at …", so the partial copies go away here.
      await rollback(client, bucket, copied)
      failures.push({
        collection: move.collection,
        id: move.id,
        reason: `the move failed and was rolled back: ${error instanceof Error ? error.message : String(error)}`,
      })
      continue
    }

    for (const key of move.keys) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key.source }))
    }

    moved += 1
    console.log(`  moved ${move.collection}#${move.id} -> ${move.targetPrefix}`)
  }

  return { failures, moved }
}

/** Removes the target objects of a row whose move failed part-way, so the row stays retryable. */
const rollback = async (client: S3Client, bucket: string, keys: string[]): Promise<void> => {
  for (const key of keys) {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    } catch (error) {
      console.log(`  ROLLBACK FAILED ${key}: ${error instanceof Error ? error.message : error}`)
    }
  }
}

const USAGE = `Usage: yarn s3:move-prefixes [--apply] [--help]

Moves every documents or media object whose S3 prefix does not name its own organisation, then
re-points the row at the new key. Dry run by default.

Required env vars (via .env):
  DATABASE_URI          Postgres connection string
  S3_BUCKET             The bucket that holds the uploads
  S3_ENDPOINT           The S3 endpoint
  S3_ACCESS_KEY_ID      The access key
  S3_SECRET_ACCESS_KEY  The secret key
  S3_REGION             The region SigV4 signs with

Options:
  --apply    Move the objects and write the prefixes. Without it the script only reports.
  --help     Print this text.

The orphan report lists a freshly copied object as an orphan until the row update lands.
\`isTooRecentToDelete\` refuses a delete inside 24 hours, so a concurrent report is safe. Re-run the
report after this script, because the old keys become real orphans until the delete step removes them.`

const run = async () => {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(USAGE)
    process.exit(0)
  }

  const shouldApply = process.argv.includes('--apply')
  const bucket = process.env.S3_BUCKET || ''
  if (!bucket) throw new Error('S3_BUCKET is not set')

  const { default: config } = await import('../payload.config.js')
  const payload = await getPayload({ config })

  const client = new S3Client({
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    endpoint: process.env.S3_ENDPOINT || '',
    forcePathStyle: true,
    region: process.env.S3_REGION || 'auto',
  })

  console.log(`Listing objects in ${bucket} …`)
  const bucketKeys = await listAllKeys(client, bucket)
  console.log(`  ${bucketKeys.size} objects\n`)

  const { moves, refusals, scanned } = await plan(payload, bucketKeys)

  console.log(`Checked ${scanned} records`)
  console.log(`  movable  ${moves.length}`)
  console.log(`  refused  ${refusals.length}\n`)

  for (const move of moves) {
    for (const key of move.keys) console.log(`  ${key.source} -> ${key.target}`)
  }
  for (const refusal of refusals) {
    console.log(`  REFUSED ${refusal.collection}#${refusal.id}: ${refusal.reason}`)
  }

  if (!shouldApply) {
    console.log('\nDry run — pass --apply to move these objects.')
    process.exit(0)
  }

  console.log(`\nMoving ${moves.length} records …`)
  const { failures, moved } = await apply(payload, client, bucket, moves)

  for (const failure of failures) {
    console.log(`  FAILED ${failure.collection}#${failure.id}: ${failure.reason}`)
  }

  console.log(`\nDone. Moved ${moved} of ${moves.length}.`)
  console.log('Re-run the orphan report: the old keys are orphans until the delete step clears.')
  process.exit(refusals.length + failures.length > 0 ? 1 : 0)
}

void run()
