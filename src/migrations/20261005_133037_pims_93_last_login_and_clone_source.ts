import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "cloned_from_organisation_id" integer;
  ALTER TABLE "task_flows" ADD COLUMN IF NOT EXISTS "cloned_from_organisation_id" integer;
  ALTER TABLE "task_lists" ADD COLUMN IF NOT EXISTS "cloned_from_organisation_id" integer;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp(3) with time zone;
  ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "activities_cloned_from_organisation_id_organisations_id_fk";
  ALTER TABLE "activities" ADD CONSTRAINT "activities_cloned_from_organisation_id_organisations_id_fk" FOREIGN KEY ("cloned_from_organisation_id") REFERENCES "public"."organisations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "task_flows" DROP CONSTRAINT IF EXISTS "task_flows_cloned_from_organisation_id_organisations_id_fk";
  ALTER TABLE "task_flows" ADD CONSTRAINT "task_flows_cloned_from_organisation_id_organisations_id_fk" FOREIGN KEY ("cloned_from_organisation_id") REFERENCES "public"."organisations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "task_lists" DROP CONSTRAINT IF EXISTS "task_lists_cloned_from_organisation_id_organisations_id_fk";
  ALTER TABLE "task_lists" ADD CONSTRAINT "task_lists_cloned_from_organisation_id_organisations_id_fk" FOREIGN KEY ("cloned_from_organisation_id") REFERENCES "public"."organisations"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "activities_cloned_from_organisation_idx" ON "activities" USING btree ("cloned_from_organisation_id");
  CREATE INDEX IF NOT EXISTS "task_flows_cloned_from_organisation_idx" ON "task_flows" USING btree ("cloned_from_organisation_id");
  CREATE INDEX IF NOT EXISTS "task_lists_cloned_from_organisation_idx" ON "task_lists" USING btree ("cloned_from_organisation_id");
  CREATE INDEX IF NOT EXISTS "users_last_login_at_idx" ON "users" USING btree ("last_login_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "activities_cloned_from_organisation_id_organisations_id_fk";
  ALTER TABLE "task_flows" DROP CONSTRAINT IF EXISTS "task_flows_cloned_from_organisation_id_organisations_id_fk";
  ALTER TABLE "task_lists" DROP CONSTRAINT IF EXISTS "task_lists_cloned_from_organisation_id_organisations_id_fk";
  DROP INDEX IF EXISTS "activities_cloned_from_organisation_idx";
  DROP INDEX IF EXISTS "task_flows_cloned_from_organisation_idx";
  DROP INDEX IF EXISTS "task_lists_cloned_from_organisation_idx";
  DROP INDEX IF EXISTS "users_last_login_at_idx";
  ALTER TABLE "activities" DROP COLUMN IF EXISTS "cloned_from_organisation_id";
  ALTER TABLE "task_flows" DROP COLUMN IF EXISTS "cloned_from_organisation_id";
  ALTER TABLE "task_lists" DROP COLUMN IF EXISTS "cloned_from_organisation_id";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "last_login_at";`)
}
