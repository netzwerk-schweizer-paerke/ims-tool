import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Check if 'fr' value exists in the enum
  const frExists = await db.execute(sql`
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'fr'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = '_locales')
  `)

  // Check if 'it' value exists in the enum
  const itExists = await db.execute(sql`
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'it'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = '_locales')
  `)

  console.log('frExists', { frExists })
  console.log('itExists', { itExists })

  // Add 'fr' if it doesn't exist
  if (frExists.rowCount === 0) {
    await db.execute(sql`ALTER TYPE "public"."_locales" ADD VALUE 'fr'`)
  }

  // Add 'it' if it doesn't exist
  if (itExists.rowCount === 0) {
    await db.execute(sql`ALTER TYPE "public"."_locales" ADD VALUE 'it'`)
  }

  // Original, generated migration that might fail in production or if an enum value is already present
  // await db.execute(sql`
  //  ALTER TYPE "public"."_locales" ADD VALUE 'fr';
  // ALTER TYPE "public"."_locales" ADD VALUE 'it';`)
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
