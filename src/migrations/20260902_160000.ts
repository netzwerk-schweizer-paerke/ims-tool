import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * PIMS-88. It realigns upload prefixes that an appending beforeChange hook broke.
 *
 * The hook appended "/<org-id>" on every save. A document therefore recorded
 * "documents/12/12" while its object stayed at "documents/12". Payload builds
 * the S3 key from the stored prefix, so those documents answered 404.
 *
 * See .claude/rules/project/pitfalls/s3-upload-prefix-depends-on-beforechange-hook.md
 */

/**
 * These documents really do sit at the repeated key. Each one was uploaded after
 * its prefix had doubled, so it works today. A collapse would break all 11.
 * Verified against the production bucket on 2026-09-02.
 */
const KEEP_REPEATED_PREFIX = [248, 264, 407, 408, 409, 483, 484, 490, 492, 531, 589]

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  // The pattern matches a segment that repeats itself, which is the exact shape
  // the hook produced. "documents/null" has no repetition and stays untouched.
  const result = await db.execute(sql`
    UPDATE documents
    SET prefix = substring(prefix from '^[^/]+/[^/]+')
    WHERE prefix ~ '^([^/]+)/([^/]+)(/\\2)+$'
      AND id <> ALL (${sql.raw(`ARRAY[${KEEP_REPEATED_PREFIX.join(',')}]::integer[]`)})
    RETURNING id, prefix
  `)

  // The row count goes to the deploy log, so the outcome is recorded and not
  // inferred later. This migration preserves updatedAt, so it leaves no other trace.
  const rows = (result as unknown as { rows?: { id: number; prefix: string }[] }).rows ?? []
  payload.logger.info(
    { count: rows.length, ids: rows.map((row) => row.id) },
    '[PIMS-88] Collapsed repeated upload prefixes',
  )
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // The previous values addressed no object, so there is nothing worth restoring.
  // Restore the pre-migration dump if you must roll back.
}
