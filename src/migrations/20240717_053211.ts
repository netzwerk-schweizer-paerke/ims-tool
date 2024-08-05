import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 ALTER TABLE "activities" ADD COLUMN "doc_order" numeric;
ALTER TABLE "task_flows" ADD COLUMN "doc_order" numeric;
ALTER TABLE "task_lists" ADD COLUMN "doc_order" numeric;
CREATE INDEX IF NOT EXISTS "activities_doc_order_idx" ON "activities" ("doc_order");
CREATE INDEX IF NOT EXISTS "task_flows_doc_order_idx" ON "task_flows" ("doc_order");
CREATE INDEX IF NOT EXISTS "task_lists_doc_order_idx" ON "task_lists" ("doc_order");`);
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 ALTER TYPE "_locales" ADD VALUE 'en';
ALTER TYPE "_locales" ADD VALUE 'fr';
ALTER TYPE "_locales" ADD VALUE 'it';
DROP INDEX IF EXISTS "activities_doc_order_idx";
DROP INDEX IF EXISTS "task_flows_doc_order_idx";
DROP INDEX IF EXISTS "task_lists_doc_order_idx";
ALTER TABLE "activities" DROP COLUMN IF EXISTS "doc_order";
ALTER TABLE "task_flows" DROP COLUMN IF EXISTS "doc_order";
ALTER TABLE "task_lists" DROP COLUMN IF EXISTS "doc_order";`);
}
