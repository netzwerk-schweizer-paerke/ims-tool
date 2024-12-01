import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 ALTER TABLE "documents_public" ADD COLUMN "prefix" varchar DEFAULT 'documents-public';`)
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 ALTER TABLE "documents_public" DROP COLUMN IF EXISTS "prefix";`)
}
