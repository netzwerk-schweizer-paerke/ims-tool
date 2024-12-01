import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
   CREATE INDEX IF NOT EXISTS "media_organisation_idx" ON "media" USING btree ("organisation_id");
  CREATE INDEX IF NOT EXISTS "media_created_by_idx" ON "media" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "media_updated_by_idx" ON "media" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "organisations_created_by_idx" ON "organisations" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "organisations_updated_by_idx" ON "organisations" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "organisations_updated_at_idx" ON "organisations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "activities_files_document_idx" ON "activities_files_locales" USING btree ("document_id","_locale");
  CREATE INDEX IF NOT EXISTS "activities_organisation_idx" ON "activities" USING btree ("organisation_id");
  CREATE INDEX IF NOT EXISTS "activities_created_by_idx" ON "activities" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "activities_updated_by_idx" ON "activities" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "activities_updated_at_idx" ON "activities" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "activities_rels_task_flows_id_idx" ON "activities_rels" USING btree ("task_flows_id","locale");
  CREATE INDEX IF NOT EXISTS "activities_rels_task_lists_id_idx" ON "activities_rels" USING btree ("task_lists_id","locale");
  CREATE INDEX IF NOT EXISTS "documents_organisation_idx" ON "documents" USING btree ("organisation_id");
  CREATE INDEX IF NOT EXISTS "documents_created_by_idx" ON "documents" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "documents_updated_by_idx" ON "documents" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "documents_public_updated_at_idx" ON "documents_public" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "task_flows_files_document_idx" ON "task_flows_files_locales" USING btree ("document_id","_locale");
  CREATE INDEX IF NOT EXISTS "task_flows_organisation_idx" ON "task_flows" USING btree ("organisation_id");
  CREATE INDEX IF NOT EXISTS "task_flows_created_by_idx" ON "task_flows" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "task_flows_updated_by_idx" ON "task_flows" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "task_flows_updated_at_idx" ON "task_flows" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "task_lists_files_document_idx" ON "task_lists_files_locales" USING btree ("document_id","_locale");
  CREATE INDEX IF NOT EXISTS "task_lists_organisation_idx" ON "task_lists" USING btree ("organisation_id");
  CREATE INDEX IF NOT EXISTS "task_lists_created_by_idx" ON "task_lists" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "task_lists_updated_by_idx" ON "task_lists" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "task_lists_updated_at_idx" ON "task_lists" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "users_organisations_organisation_idx" ON "users_organisations" USING btree ("organisation_id");
  CREATE INDEX IF NOT EXISTS "users_selected_organisation_idx" ON "users" USING btree ("selected_organisation_id");
  CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_organisations_id_idx" ON "payload_locked_documents_rels" USING btree ("organisations_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_activities_id_idx" ON "payload_locked_documents_rels" USING btree ("activities_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_documents_public_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_public_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_task_flows_id_idx" ON "payload_locked_documents_rels" USING btree ("task_flows_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_task_lists_id_idx" ON "payload_locked_documents_rels" USING btree ("task_lists_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");`)
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
   DROP INDEX IF EXISTS "media_organisation_idx";
  DROP INDEX IF EXISTS "media_created_by_idx";
  DROP INDEX IF EXISTS "media_updated_by_idx";
  DROP INDEX IF EXISTS "media_updated_at_idx";
  DROP INDEX IF EXISTS "organisations_created_by_idx";
  DROP INDEX IF EXISTS "organisations_updated_by_idx";
  DROP INDEX IF EXISTS "organisations_updated_at_idx";
  DROP INDEX IF EXISTS "activities_files_document_idx";
  DROP INDEX IF EXISTS "activities_organisation_idx";
  DROP INDEX IF EXISTS "activities_created_by_idx";
  DROP INDEX IF EXISTS "activities_updated_by_idx";
  DROP INDEX IF EXISTS "activities_updated_at_idx";
  DROP INDEX IF EXISTS "activities_rels_task_flows_id_idx";
  DROP INDEX IF EXISTS "activities_rels_task_lists_id_idx";
  DROP INDEX IF EXISTS "documents_organisation_idx";
  DROP INDEX IF EXISTS "documents_created_by_idx";
  DROP INDEX IF EXISTS "documents_updated_by_idx";
  DROP INDEX IF EXISTS "documents_updated_at_idx";
  DROP INDEX IF EXISTS "documents_public_updated_at_idx";
  DROP INDEX IF EXISTS "task_flows_files_document_idx";
  DROP INDEX IF EXISTS "task_flows_organisation_idx";
  DROP INDEX IF EXISTS "task_flows_created_by_idx";
  DROP INDEX IF EXISTS "task_flows_updated_by_idx";
  DROP INDEX IF EXISTS "task_flows_updated_at_idx";
  DROP INDEX IF EXISTS "task_lists_files_document_idx";
  DROP INDEX IF EXISTS "task_lists_organisation_idx";
  DROP INDEX IF EXISTS "task_lists_created_by_idx";
  DROP INDEX IF EXISTS "task_lists_updated_by_idx";
  DROP INDEX IF EXISTS "task_lists_updated_at_idx";
  DROP INDEX IF EXISTS "users_organisations_organisation_idx";
  DROP INDEX IF EXISTS "users_selected_organisation_idx";
  DROP INDEX IF EXISTS "users_updated_at_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_updated_at_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_media_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_organisations_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_activities_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_documents_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_documents_public_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_task_flows_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_task_lists_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_users_id_idx";
  DROP INDEX IF EXISTS "payload_preferences_updated_at_idx";
  DROP INDEX IF EXISTS "payload_preferences_rels_users_id_idx";
  DROP INDEX IF EXISTS "payload_migrations_updated_at_idx";`)
}
