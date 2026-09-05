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
 * **It reads `pg` and the S3 SDK directly, and it never boots Payload.** The deployed image is a
 * Next standalone build with no `src/` and no `tsx`, and it publishes no database port. Both
 * packages are already inside that image, so this one file runs there unchanged. The update
 * touches the `prefix` column alone, which leaves `updated_at` as it was.
 *
 * Dry run by default. Pass --apply to write.
 *
 *   yarn s3:move-prefixes
 *   yarn s3:move-prefixes --apply
 *
 * In production, run it inside the app container, which already holds the credentials:
 *
 *   docker cp move-upload-prefixes.ts app:/tmp/
 *   docker exec app node --experimental-strip-types --no-warnings /tmp/move-upload-prefixes.ts
 */
/* eslint-disable unicorn/no-process-exit -- CLI entry point: the exit code is the result. */
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3'
import { Client } from 'pg'

/** Collections whose objects are filed under a per-organisation prefix, with their tables. */
const COLLECTIONS = [
  { prefixBase: 'documents', table: 'documents' },
  { prefixBase: 'media', table: 'media' },
] as const

interface Move {
  id: number
  /** Every key the row claims, paired with where that key must end up. */
  keys: { source: string; target: string }[]
  table: string
  targetPrefix: string
}

interface Refusal {
  id: number
  reason: string
  table: string
}

/**
 * Builds the `x-amz-copy-source` value.
 *
 * The header carries `<bucket>/<key>` and the key must be URL-encoded. Each segment is encoded on
 * its own, so the separators stay literal. Verified against garage v2.2.0 on 2026-09-05.
 */
const copySourceOf = (bucket: string, key: string): string =>
  `${bucket}/${key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`

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
 * Reads the size-variant filename columns from the catalog.
 *
 * Media declares three image sizes today and documents declares none. A new size adds a column, so
 * the catalog is the only source that stays correct.
 */
const sizeFilenameColumns = async (pg: Client, table: string): Promise<string[]> => {
  const { rows } = await pg.query<{ column_name: string }>(
    String.raw`select column_name from information_schema.columns
     where table_schema = 'public' and table_name = $1 and column_name like 'sizes\_%\_filename'
     order by column_name`,
    [table],
  )

  return rows.map((row) => row.column_name)
}

const plan = async (
  pg: Client,
  bucketKeys: Set<string>,
): Promise<{ moves: Move[]; refusals: Refusal[]; scanned: number }> => {
  const moves: Move[] = []
  const refusals: Refusal[] = []
  let scanned = 0

  for (const { prefixBase, table } of COLLECTIONS) {
    const sizeColumns = await sizeFilenameColumns(pg, table)
    // The names come from the catalog, never from input, and each one is quoted.
    const selected = ['id', 'filename', 'prefix', 'organisation_id', ...sizeColumns]
      .map((column) => `"${column}"`)
      .join(', ')

    const { rows } = await pg.query<Record<string, null | number | string>>(
      `select ${selected} from "${table}" order by id`,
    )

    for (const row of rows) {
      scanned += 1

      const id = Number(row.id)
      const organisationId = row.organisation_id === null ? null : Number(row.organisation_id)
      const prefix = typeof row.prefix === 'string' ? row.prefix : ''

      // A row with no organisation is the shape this repair exists to prevent, so it is named
      // rather than skipped. `TenantHealthChecker` passes over it too, because it owns no park.
      if (organisationId === null) {
        if (prefix) refusals.push({ id, reason: 'the row names no organisation', table })
        continue
      }

      const targetPrefix = `${prefixBase}/${organisationId}`

      if (!prefix || prefix === targetPrefix) continue

      const filenames = ['filename', ...sizeColumns]
        .map((column) => row[column])
        .filter((value): value is string => typeof value === 'string' && value !== '')

      if (filenames.length === 0) {
        refusals.push({ id, reason: 'the row names no file', table })
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
          id,
          reason: `the bucket holds no object at ${absent.map((key) => key.source).join(', ')}`,
          table,
        })
        continue
      }

      if (occupied.length > 0) {
        refusals.push({
          id,
          reason: `an object already sits at ${occupied.map((key) => key.target).join(', ')}`,
          table,
        })
        continue
      }

      moves.push({ id, keys, table, targetPrefix })
    }
  }

  return { moves, refusals, scanned }
}

const apply = async (
  pg: Client,
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

      await pg.query(`update "${move.table}" set "prefix" = $1 where "id" = $2`, [
        move.targetPrefix,
        move.id,
      ])
    } catch (error) {
      // A media row claims one key per size variant. A half-copied row would refuse itself on the
      // next run with "an object already sits at …", so the partial copies go away here.
      await rollback(client, bucket, copied)
      failures.push({
        id: move.id,
        reason: `the move failed and was rolled back: ${error instanceof Error ? error.message : String(error)}`,
        table: move.table,
      })
      continue
    }

    for (const key of move.keys) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key.source }))
    }

    moved += 1
    console.log(`  moved ${move.table}#${move.id} -> ${move.targetPrefix}`)
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

const USAGE = `Usage: move-upload-prefixes [--apply] [--limit <n>] [--help]

Moves every documents or media object whose S3 prefix does not name its own organisation, then
re-points the row at the new key. Dry run by default.

Required env vars:
  POSTGRES_URI          Postgres connection string
  S3_BUCKET             The bucket that holds the uploads
  S3_ENDPOINT           The S3 endpoint
  S3_ACCESS_KEY_ID      The access key
  S3_SECRET_ACCESS_KEY  The secret key
  S3_REGION             The region SigV4 signs with, 'auto' when unset

Options:
  --apply      Move the objects and write the prefixes. Without it the script only reports.
  --limit <n>  Move at most n records. Use it to prove the first row on a new S3 provider.
  --help       Print this text.

Locally, pass the environment with 'node --env-file=.env'. In production, run it inside the app
container, which already holds the credentials and reaches Postgres and MinIO on the internal
network.

The orphan report lists a freshly copied object as an orphan until the row update lands.
\`isTooRecentToDelete\` refuses a delete inside 24 hours, so a concurrent report is safe. Re-run the
report after this script, because the old keys become real orphans until the delete step removes them.`

/** Reads `--limit <n>`. Returns null when the flag is absent, and throws on an unusable value. */
const limitFromArgv = (argv: string[]): null | number => {
  const index = argv.indexOf('--limit')
  if (index === -1) return null

  const parsed = Number(argv[index + 1])

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`--limit needs a positive whole number, and it got '${argv[index + 1]}'`)
  }

  return parsed
}

const run = async () => {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(USAGE)
    process.exit(0)
  }

  const limit = limitFromArgv(process.argv)
  const shouldApply = process.argv.includes('--apply')

  const bucket = process.env.S3_BUCKET || ''
  const connectionString = process.env.POSTGRES_URI || ''
  if (!bucket) throw new Error('S3_BUCKET is not set')
  if (!connectionString) throw new Error('POSTGRES_URI is not set')

  const client = new S3Client({
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    endpoint: process.env.S3_ENDPOINT || '',
    forcePathStyle: true,
    region: process.env.S3_REGION || 'auto',
  })

  const pg = new Client({ connectionString })
  await pg.connect()

  try {
    console.log(`Listing objects in ${bucket} …`)
    const bucketKeys = await listAllKeys(client, bucket)
    console.log(`  ${bucketKeys.size} objects\n`)

    const { moves, refusals, scanned } = await plan(pg, bucketKeys)
    const selected = limit === null ? moves : moves.slice(0, limit)

    console.log(`Checked ${scanned} records`)
    console.log(`  movable  ${moves.length}`)
    console.log(`  refused  ${refusals.length}`)
    if (limit !== null) console.log(`  selected ${selected.length} of ${moves.length} by --limit`)
    console.log('')

    for (const move of selected) {
      for (const key of move.keys) console.log(`  ${key.source} -> ${key.target}`)
    }
    for (const refusal of refusals) {
      console.log(`  REFUSED ${refusal.table}#${refusal.id}: ${refusal.reason}`)
    }

    if (!shouldApply) {
      console.log('\nDry run — pass --apply to move these objects.')
      return refusals.length > 0 ? 1 : 0
    }

    console.log(`\nMoving ${selected.length} records …`)
    const { failures, moved } = await apply(pg, client, bucket, selected)

    for (const failure of failures) {
      console.log(`  FAILED ${failure.table}#${failure.id}: ${failure.reason}`)
    }

    console.log(`\nDone. Moved ${moved} of ${selected.length}.`)
    console.log('Re-run the orphan report: the old keys are orphans until the delete step clears.')

    return refusals.length + failures.length > 0 ? 1 : 0
  } finally {
    await pg.end()
  }
}

const code = await run()
process.exit(code)
