import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "share_links" ADD COLUMN IF NOT EXISTS "expires_in_months" numeric;
  ALTER TABLE "share_links" ADD COLUMN IF NOT EXISTS "expires_at" timestamp(3) with time zone;
  CREATE INDEX IF NOT EXISTS "share_links_expires_at_idx" ON "share_links" USING btree ("expires_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "share_links_expires_at_idx";
  ALTER TABLE "share_links" DROP COLUMN IF EXISTS "expires_in_months";
  ALTER TABLE "share_links" DROP COLUMN IF EXISTS "expires_at";`)
}
