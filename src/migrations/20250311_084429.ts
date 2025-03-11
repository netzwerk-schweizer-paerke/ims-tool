import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."_locales" ADD VALUE 'fr';
  ALTER TYPE "public"."_locales" ADD VALUE 'it';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "public"."media_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."activities_blocks_activity_io" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."activities_blocks_activity_task" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."activities_files_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."activities_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."activities_rels" ALTER COLUMN "locale" SET DATA TYPE text;
  ALTER TABLE "public"."documents_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."documents_public_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."task_flows_blocks_proc_task_io" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."task_flows_blocks_proc_test" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."task_flows_blocks_proc_task_p" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."task_flows_files_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."task_flows_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."task_lists_items" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."task_lists_files_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "public"."task_lists_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  DROP TYPE "public"."_locales";
  CREATE TYPE "public"."_locales" AS ENUM('de');
  ALTER TABLE "public"."media_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."activities_blocks_activity_io" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."activities_blocks_activity_task" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."activities_files_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."activities_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."activities_rels" ALTER COLUMN "locale" SET DATA TYPE "public"."_locales" USING "locale"::"public"."_locales";
  ALTER TABLE "public"."documents_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."documents_public_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."task_flows_blocks_proc_task_io" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."task_flows_blocks_proc_test" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."task_flows_blocks_proc_task_p" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."task_flows_files_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."task_flows_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."task_lists_items" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."task_lists_files_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "public"."task_lists_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";`)
}
