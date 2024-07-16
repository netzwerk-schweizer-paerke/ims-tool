import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 ALTER TABLE "media" ADD COLUMN "prefix" varchar;
ALTER TABLE "documents" ADD COLUMN "prefix" varchar;`);
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 ALTER TABLE "media" DROP COLUMN IF EXISTS "prefix";
ALTER TABLE "documents" DROP COLUMN IF EXISTS "prefix";`);
}
