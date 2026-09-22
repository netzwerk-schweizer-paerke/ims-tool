import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
  ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
  ALTER TABLE "documents_public" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN IF EXISTS "_objectkey";
  ALTER TABLE "documents" DROP COLUMN IF EXISTS "_objectkey";
  ALTER TABLE "documents_public" DROP COLUMN IF EXISTS "_objectkey";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_requested_at";`)
}
