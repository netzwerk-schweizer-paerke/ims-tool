import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE INDEX IF NOT EXISTS "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "activities_files_locales_parent_id_idx" ON "activities_files_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "activities_locales_parent_id_idx" ON "activities_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "documents_locales_parent_id_idx" ON "documents_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "documents_public_locales_parent_id_idx" ON "documents_public_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "task_flows_files_locales_parent_id_idx" ON "task_flows_files_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "task_flows_locales_parent_id_idx" ON "task_flows_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "task_lists_files_locales_parent_id_idx" ON "task_lists_files_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "task_lists_locales_parent_id_idx" ON "task_lists_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "media_locales_parent_id_idx";
  DROP INDEX IF EXISTS "activities_files_locales_parent_id_idx";
  DROP INDEX IF EXISTS "activities_locales_parent_id_idx";
  DROP INDEX IF EXISTS "documents_locales_parent_id_idx";
  DROP INDEX IF EXISTS "documents_public_locales_parent_id_idx";
  DROP INDEX IF EXISTS "task_flows_files_locales_parent_id_idx";
  DROP INDEX IF EXISTS "task_flows_locales_parent_id_idx";
  DROP INDEX IF EXISTS "task_lists_files_locales_parent_id_idx";
  DROP INDEX IF EXISTS "task_lists_locales_parent_id_idx";`)
}
