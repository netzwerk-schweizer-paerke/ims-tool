import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
   DROP TABLE "activities_blocks_activity_io_locales";
  DROP TABLE "activities_blocks_activity_task_locales";
  DROP TABLE "task_flows_blocks_proc_task_io_locales";
  DROP TABLE "task_flows_blocks_proc_test_locales";
  DROP TABLE "task_flows_blocks_proc_task_p_locales";
  DROP TABLE "task_lists_items_locales";
  ALTER TABLE "activities_blocks_activity_io" ADD COLUMN "graph_task" jsonb;
  ALTER TABLE "activities_blocks_activity_io" ADD COLUMN "io_input" jsonb;
  ALTER TABLE "activities_blocks_activity_io" ADD COLUMN "io_output" jsonb;
  ALTER TABLE "activities_blocks_activity_io" ADD COLUMN "infos_norms" jsonb;
  ALTER TABLE "activities_blocks_activity_io" ADD COLUMN "infos_support" jsonb;
  ALTER TABLE "activities_blocks_activity_task" ADD COLUMN "graph_task" jsonb;
  ALTER TABLE "activities_blocks_activity_task" ADD COLUMN "io_input" jsonb;
  ALTER TABLE "activities_blocks_activity_task" ADD COLUMN "io_output" jsonb;
  ALTER TABLE "activities_blocks_activity_task" ADD COLUMN "infos_norms" jsonb;
  ALTER TABLE "activities_blocks_activity_task" ADD COLUMN "infos_support" jsonb;
  ALTER TABLE "activities_rels" ADD COLUMN "locale" "_locales";
  ALTER TABLE "task_flows_blocks_proc_task_io" ADD COLUMN "graph_io" jsonb;
  ALTER TABLE "task_flows_blocks_proc_task_io" ADD COLUMN "graph_task" jsonb;
  ALTER TABLE "task_flows_blocks_proc_task_io" ADD COLUMN "keypoints_keypoints" jsonb;
  ALTER TABLE "task_flows_blocks_proc_task_io" ADD COLUMN "tools_tools" jsonb;
  ALTER TABLE "task_flows_blocks_proc_task_io" ADD COLUMN "responsibility_responsibility" jsonb;
  ALTER TABLE "task_flows_blocks_proc_test" ADD COLUMN "graph_output" jsonb;
  ALTER TABLE "task_flows_blocks_proc_test" ADD COLUMN "graph_test" jsonb;
  ALTER TABLE "task_flows_blocks_proc_test" ADD COLUMN "keypoints_keypoints" jsonb;
  ALTER TABLE "task_flows_blocks_proc_test" ADD COLUMN "tools_tools" jsonb;
  ALTER TABLE "task_flows_blocks_proc_test" ADD COLUMN "responsibility_responsibility" jsonb;
  ALTER TABLE "task_flows_blocks_proc_task_p" ADD COLUMN "graph_task" jsonb;
  ALTER TABLE "task_flows_blocks_proc_task_p" ADD COLUMN "keypoints_keypoints" jsonb;
  ALTER TABLE "task_flows_blocks_proc_task_p" ADD COLUMN "tools_tools" jsonb;
  ALTER TABLE "task_flows_blocks_proc_task_p" ADD COLUMN "responsibility_responsibility" jsonb;
  ALTER TABLE "task_lists_items" ADD COLUMN "topic" jsonb;
  ALTER TABLE "task_lists_items" ADD COLUMN "tools" jsonb;
  ALTER TABLE "task_lists_items" ADD COLUMN "responsibility" jsonb;
  CREATE INDEX IF NOT EXISTS "activities_rels_locale_idx" ON "activities_rels" USING btree ("locale");`);
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
   CREATE TABLE IF NOT EXISTS "activities_blocks_activity_io_locales" (
  	"graph_task" jsonb,
  	"io_input" jsonb,
  	"io_output" jsonb,
  	"infos_norms" jsonb,
  	"infos_support" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	CONSTRAINT "activities_blocks_activity_io_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
  );
  
  CREATE TABLE IF NOT EXISTS "activities_blocks_activity_task_locales" (
  	"graph_task" jsonb,
  	"io_input" jsonb,
  	"io_output" jsonb,
  	"infos_norms" jsonb,
  	"infos_support" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	CONSTRAINT "activities_blocks_activity_task_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
  );
  
  CREATE TABLE IF NOT EXISTS "task_flows_blocks_proc_task_io_locales" (
  	"graph_io" jsonb,
  	"graph_task" jsonb,
  	"keypoints_keypoints" jsonb,
  	"tools_tools" jsonb,
  	"responsibility_responsibility" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	CONSTRAINT "task_flows_blocks_proc_task_io_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
  );
  
  CREATE TABLE IF NOT EXISTS "task_flows_blocks_proc_test_locales" (
  	"graph_output" jsonb,
  	"graph_test" jsonb,
  	"keypoints_keypoints" jsonb,
  	"tools_tools" jsonb,
  	"responsibility_responsibility" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	CONSTRAINT "task_flows_blocks_proc_test_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
  );
  
  CREATE TABLE IF NOT EXISTS "task_flows_blocks_proc_task_p_locales" (
  	"graph_task" jsonb,
  	"keypoints_keypoints" jsonb,
  	"tools_tools" jsonb,
  	"responsibility_responsibility" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	CONSTRAINT "task_flows_blocks_proc_task_p_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
  );
  
  CREATE TABLE IF NOT EXISTS "task_lists_items_locales" (
  	"topic" jsonb,
  	"tools" jsonb,
  	"responsibility" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	CONSTRAINT "task_lists_items_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
  );
  
  DROP INDEX IF EXISTS "activities_rels_locale_idx";
  DO $$ BEGIN
   ALTER TABLE "activities_blocks_activity_io_locales" ADD CONSTRAINT "activities_blocks_activity_io_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."activities_blocks_activity_io"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "activities_blocks_activity_task_locales" ADD CONSTRAINT "activities_blocks_activity_task_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."activities_blocks_activity_task"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "task_flows_blocks_proc_task_io_locales" ADD CONSTRAINT "task_flows_blocks_proc_task_io_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."task_flows_blocks_proc_task_io"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "task_flows_blocks_proc_test_locales" ADD CONSTRAINT "task_flows_blocks_proc_test_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."task_flows_blocks_proc_test"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "task_flows_blocks_proc_task_p_locales" ADD CONSTRAINT "task_flows_blocks_proc_task_p_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."task_flows_blocks_proc_task_p"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "task_lists_items_locales" ADD CONSTRAINT "task_lists_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."task_lists_items"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  ALTER TABLE "activities_blocks_activity_io" DROP COLUMN IF EXISTS "graph_task";
  ALTER TABLE "activities_blocks_activity_io" DROP COLUMN IF EXISTS "io_input";
  ALTER TABLE "activities_blocks_activity_io" DROP COLUMN IF EXISTS "io_output";
  ALTER TABLE "activities_blocks_activity_io" DROP COLUMN IF EXISTS "infos_norms";
  ALTER TABLE "activities_blocks_activity_io" DROP COLUMN IF EXISTS "infos_support";
  ALTER TABLE "activities_blocks_activity_task" DROP COLUMN IF EXISTS "graph_task";
  ALTER TABLE "activities_blocks_activity_task" DROP COLUMN IF EXISTS "io_input";
  ALTER TABLE "activities_blocks_activity_task" DROP COLUMN IF EXISTS "io_output";
  ALTER TABLE "activities_blocks_activity_task" DROP COLUMN IF EXISTS "infos_norms";
  ALTER TABLE "activities_blocks_activity_task" DROP COLUMN IF EXISTS "infos_support";
  ALTER TABLE "activities_rels" DROP COLUMN IF EXISTS "locale";
  ALTER TABLE "task_flows_blocks_proc_task_io" DROP COLUMN IF EXISTS "graph_io";
  ALTER TABLE "task_flows_blocks_proc_task_io" DROP COLUMN IF EXISTS "graph_task";
  ALTER TABLE "task_flows_blocks_proc_task_io" DROP COLUMN IF EXISTS "keypoints_keypoints";
  ALTER TABLE "task_flows_blocks_proc_task_io" DROP COLUMN IF EXISTS "tools_tools";
  ALTER TABLE "task_flows_blocks_proc_task_io" DROP COLUMN IF EXISTS "responsibility_responsibility";
  ALTER TABLE "task_flows_blocks_proc_test" DROP COLUMN IF EXISTS "graph_output";
  ALTER TABLE "task_flows_blocks_proc_test" DROP COLUMN IF EXISTS "graph_test";
  ALTER TABLE "task_flows_blocks_proc_test" DROP COLUMN IF EXISTS "keypoints_keypoints";
  ALTER TABLE "task_flows_blocks_proc_test" DROP COLUMN IF EXISTS "tools_tools";
  ALTER TABLE "task_flows_blocks_proc_test" DROP COLUMN IF EXISTS "responsibility_responsibility";
  ALTER TABLE "task_flows_blocks_proc_task_p" DROP COLUMN IF EXISTS "graph_task";
  ALTER TABLE "task_flows_blocks_proc_task_p" DROP COLUMN IF EXISTS "keypoints_keypoints";
  ALTER TABLE "task_flows_blocks_proc_task_p" DROP COLUMN IF EXISTS "tools_tools";
  ALTER TABLE "task_flows_blocks_proc_task_p" DROP COLUMN IF EXISTS "responsibility_responsibility";
  ALTER TABLE "task_lists_items" DROP COLUMN IF EXISTS "topic";
  ALTER TABLE "task_lists_items" DROP COLUMN IF EXISTS "tools";
  ALTER TABLE "task_lists_items" DROP COLUMN IF EXISTS "responsibility";`);
}
