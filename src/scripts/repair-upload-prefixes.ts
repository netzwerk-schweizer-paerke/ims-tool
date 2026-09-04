/**
 * PIMS-88 repair — realigns stored upload prefixes with the objects they address.
 *
 * `assignOrgToUploadBeforeChangeHook` used to append `/<org-id>` on every save,
 * so a document could end up recorded at `documents/18/18/<file>` while its
 * object sits at `documents/18/<file>`. Payload's static handler resolves the
 * key from the stored prefix, so those documents answer 404.
 *
 * This script does not guess: it lists the bucket once, then for each row whose
 * recorded key is absent it looks for an object with the same filename and
 * rewrites the prefix to where that object actually is. Anything ambiguous or
 * genuinely missing is reported, never touched.
 *
 * Dry run by default. Pass --apply to write.
 *
 *   yarn tsx src/scripts/repair-upload-prefixes.ts
 *   yarn tsx src/scripts/repair-upload-prefixes.ts --apply
 */
/* eslint-disable unicorn/no-process-exit -- CLI entry point: the exit code is the result. */
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import { CollectionSlug, getPayload } from 'payload'

import { getS3Client } from '@/lib/s3-client'

dotenv.config()

/** Collections whose objects are filed under a per-document prefix. */
const COLLECTIONS: CollectionSlug[] = ['documents', 'documents-public', 'media']

type Outcome =
  | { candidates: string[]; kind: 'ambiguous'; row: Row }
  | { kind: 'missing'; row: Row }
  | { kind: 'ok'; row: Row }
  | { kind: 'repairable'; newPrefix: string; row: Row }

type Row = {
  collection: CollectionSlug
  filename: string
  id: number | string
  prefix: string
  updatedAt: string
}

/** The stored shape this script reads. Payload's own type is far wider. */
type StoredUpload = {
  filename?: string
  id: number | string
  organisation?: null | number | { id?: number }
  prefix?: string
  updatedAt?: string
}

const listAllKeys = async (client: S3Client, bucket: string): Promise<string[]> => {
  const keys: string[] = []
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
      if (object.Key) keys.push(object.Key)
    }
    continuationToken = page.NextContinuationToken
  } while (continuationToken)

  return keys
}

const dirname = (key: string) => key.slice(0, Math.max(0, key.lastIndexOf('/')))
const basename = (key: string) => key.slice(key.lastIndexOf('/') + 1)

const run = async () => {
  const apply = process.argv.includes('--apply')
  const bucket = process.env.S3_BUCKET || ''
  if (!bucket) throw new Error('S3_BUCKET is not set')

  const { default: config } = await import('../payload.config.js')
  const payload = await getPayload({ config })

  const client = getS3Client()

  console.log(`Listing objects in ${bucket} …`)
  const keys = await listAllKeys(client, bucket)
  const keySet = new Set(keys)

  // filename -> every key that ends in it, so a lost object can be located
  // wherever it landed rather than by rewriting the prefix string blindly.
  const byFilename = new Map<string, string[]>()
  for (const key of keys) {
    const name = basename(key)
    byFilename.set(name, [...(byFilename.get(name) ?? []), key])
  }
  console.log(`  ${keys.length} objects\n`)

  const outcomes: Outcome[] = []

  for (const collection of COLLECTIONS) {
    const result = await payload.find({ collection, depth: 0, limit: 0, pagination: false })

    for (const doc of result.docs as unknown as StoredUpload[]) {
      if (!doc.filename) continue

      const row: Row = {
        collection,
        filename: doc.filename,
        id: doc.id,
        prefix: doc.prefix ?? '',
        updatedAt: doc.updatedAt ?? '',
      }
      const storedKey = row.prefix ? `${row.prefix}/${row.filename}` : row.filename

      if (keySet.has(storedKey)) {
        outcomes.push({ kind: 'ok', row })
        continue
      }

      const candidates = byFilename.get(row.filename) ?? []
      if (candidates.length === 0) {
        outcomes.push({ kind: 'missing', row })
        continue
      }
      if (candidates.length === 1) {
        outcomes.push({ kind: 'repairable', newPrefix: dirname(candidates[0]!), row })
        continue
      }

      // A document that was re-saved many times left one copy per prefix depth.
      // The canonical location is the one the fixed hook now produces, so prefer
      // it. Anything else stays ambiguous and is reported, never written.
      const orgId = typeof doc.organisation === 'object' ? doc.organisation?.id : doc.organisation
      const canonical = `${collection}/${orgId}`
      const canonicalMatches = candidates.filter((key) => dirname(key) === canonical)

      if (orgId !== undefined && canonicalMatches.length === 1) {
        outcomes.push({ kind: 'repairable', newPrefix: canonical, row })
      } else {
        outcomes.push({ candidates, kind: 'ambiguous', row })
      }
    }
  }

  const of = (kind: Outcome['kind']) => outcomes.filter((o) => o.kind === kind)
  const repairable = of('repairable') as Extract<Outcome, { kind: 'repairable' }>[]

  console.log(`Checked ${outcomes.length} records`)
  console.log(`  ok         ${of('ok').length}`)
  console.log(`  repairable ${repairable.length}`)
  console.log(`  ambiguous  ${of('ambiguous').length}`)
  console.log(`  missing    ${of('missing').length}\n`)

  for (const outcome of repairable) {
    console.log(
      `  ${outcome.row.collection}#${outcome.row.id}  ${outcome.row.prefix} -> ${outcome.newPrefix}  (${outcome.row.filename})`,
    )
  }
  for (const outcome of of('ambiguous') as Extract<Outcome, { kind: 'ambiguous' }>[]) {
    console.log(
      `  AMBIGUOUS ${outcome.row.collection}#${outcome.row.id} ${outcome.row.filename}: ${outcome.candidates.join(', ')}`,
    )
  }
  for (const outcome of of('missing')) {
    console.log(
      `  MISSING   ${outcome.row.collection}#${outcome.row.id} ${outcome.row.prefix}/${outcome.row.filename}`,
    )
  }

  if (!apply) {
    console.log('\nDry run — pass --apply to write these prefixes.')
    process.exit(0)
  }

  console.log(`\nApplying ${repairable.length} prefix corrections …`)
  for (const outcome of repairable) {
    // The write goes straight through the DB adapter, because this only realigns
    // a pointer. A payload.update would fire every collection hook. The stored
    // updatedAt is carried through, so a repaired document does not read as
    // edited today.
    await payload.db.updateOne({
      collection: outcome.row.collection,
      data: { prefix: outcome.newPrefix, updatedAt: outcome.row.updatedAt },
      id: outcome.row.id,
    })
  }
  console.log('Done.')
  process.exit(0)
}

void run()
