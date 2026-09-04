/**
 * Deletes the rows a clone test run leaves in a park, from a cutoff date onward.
 *
 * `currentOrganisationCollectionWriteAccess` denies a write by a user with no selected
 * organisation, so the REST API answers 403. This script uses the Local API instead.
 *
 * Dry run by default. Pass --apply to delete.
 *
 *   yarn tsx src/scripts/delete-clone-test-rows.ts --org 6 --since 2026-09-04
 *   yarn tsx src/scripts/delete-clone-test-rows.ts --org 6 --since 2026-09-04 --apply
 */
/* eslint-disable unicorn/no-process-exit -- CLI entry point: the exit code is the result. */
import dotenv from 'dotenv'
import { CollectionSlug, getPayload } from 'payload'

dotenv.config()

/** Parents first. An activity names task flows and lists, which name documents. */
const COLLECTIONS: CollectionSlug[] = ['activities', 'task-flows', 'task-lists', 'documents']

type Row = { createdAt: string; id: number | string; label: string }

const readArg = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}

const main = async (): Promise<void> => {
  const apply = process.argv.includes('--apply')
  const organisationId = Number(readArg('org'))
  const since = readArg('since')

  if (!organisationId || !since || !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
    console.error('Usage: --org <id> --since <YYYY-MM-DD> [--apply]')
    process.exit(2)
  }

  const { default: config } = await import('../payload.config.js')
  const payload = await getPayload({ config })

  const organisation = await payload.findByID({
    collection: 'organisations',
    id: organisationId,
    overrideAccess: true,
  })

  console.log(`Organisation ${organisationId}: ${organisation.name}`)
  console.log(`Cutoff: rows created on or after ${since}\n`)

  let total = 0

  for (const collection of COLLECTIONS) {
    const found = await payload.find({
      collection,
      depth: 0,
      limit: 0,
      overrideAccess: true,
      where: {
        and: [
          { organisation: { equals: organisationId } },
          { createdAt: { greater_than_equal: `${since}T00:00:00.000Z` } },
        ],
      },
    })

    // `CollectionSlug` spans every collection, including ones without these fields.
    const rows: Row[] = found.docs.map((doc) => ({
      createdAt: 'createdAt' in doc ? String(doc.createdAt) : '',
      id: doc.id,
      label: String(
        ('name' in doc && doc.name) || ('filename' in doc && doc.filename) || '(no name)',
      ),
    }))

    total += rows.length
    console.log(`${collection}: ${rows.length} row(s)`)

    if (!apply) {
      for (const row of rows.slice(0, 5)) {
        console.log(`  ${row.id}  ${row.createdAt.slice(0, 16)}  ${row.label}`)
      }
      if (rows.length > 5) {
        console.log(`  … and ${rows.length - 5} more`)
      }
      continue
    }

    let deleted = 0
    for (const row of rows) {
      try {
        await payload.delete({ collection, id: row.id, overrideAccess: true })
        deleted++
      } catch (error) {
        console.error(`  FAILED ${row.id}: ${error instanceof Error ? error.message : error}`)
      }
    }
    console.log(`  deleted ${deleted}/${rows.length}`)
  }

  if (!apply) {
    console.log(`\nDry run — ${total} row(s) match. Pass --apply to delete them.`)
  }

  process.exit(0)
}

await main()
