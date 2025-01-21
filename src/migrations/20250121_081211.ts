import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media_locales" DROP CONSTRAINT "media_locales_locale_parent_id_unique";
  ALTER TABLE "activities_files_locales" DROP CONSTRAINT "activities_files_locales_locale_parent_id_unique";
  ALTER TABLE "activities_locales" DROP CONSTRAINT "activities_locales_locale_parent_id_unique";
  ALTER TABLE "documents_locales" DROP CONSTRAINT "documents_locales_locale_parent_id_unique";
  ALTER TABLE "documents_public_locales" DROP CONSTRAINT "documents_public_locales_locale_parent_id_unique";
  ALTER TABLE "task_flows_files_locales" DROP CONSTRAINT "task_flows_files_locales_locale_parent_id_unique";
  ALTER TABLE "task_flows_locales" DROP CONSTRAINT "task_flows_locales_locale_parent_id_unique";
  ALTER TABLE "task_lists_files_locales" DROP CONSTRAINT "task_lists_files_locales_locale_parent_id_unique";
  ALTER TABLE "task_lists_locales" DROP CONSTRAINT "task_lists_locales_locale_parent_id_unique";
  CREATE UNIQUE INDEX IF NOT EXISTS "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "activities_files_locales_locale_parent_id_unique" ON "activities_files_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "activities_locales_locale_parent_id_unique" ON "activities_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "documents_locales_locale_parent_id_unique" ON "documents_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "documents_public_locales_locale_parent_id_unique" ON "documents_public_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "task_flows_files_locales_locale_parent_id_unique" ON "task_flows_files_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "task_flows_locales_locale_parent_id_unique" ON "task_flows_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "task_lists_files_locales_locale_parent_id_unique" ON "task_lists_files_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "task_lists_locales_locale_parent_id_unique" ON "task_lists_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "media_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "activities_files_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "activities_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "documents_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "documents_public_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "task_flows_files_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "task_flows_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "task_lists_files_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "task_lists_locales_locale_parent_id_unique";
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "activities_files_locales" ADD CONSTRAINT "activities_files_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "activities_locales" ADD CONSTRAINT "activities_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "documents_locales" ADD CONSTRAINT "documents_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "documents_public_locales" ADD CONSTRAINT "documents_public_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "task_flows_files_locales" ADD CONSTRAINT "task_flows_files_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "task_flows_locales" ADD CONSTRAINT "task_flows_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "task_lists_files_locales" ADD CONSTRAINT "task_lists_files_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");
  ALTER TABLE "task_lists_locales" ADD CONSTRAINT "task_lists_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id");`)
}
