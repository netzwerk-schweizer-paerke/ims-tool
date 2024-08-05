import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 CREATE TABLE IF NOT EXISTS "task_flows_blocks_proc_task_p" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"_locale" "_locales" NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
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

CREATE INDEX IF NOT EXISTS "task_flows_blocks_proc_task_p_order_idx" ON "task_flows_blocks_proc_task_p" ("_order");
CREATE INDEX IF NOT EXISTS "task_flows_blocks_proc_task_p_parent_id_idx" ON "task_flows_blocks_proc_task_p" ("_parent_id");
CREATE INDEX IF NOT EXISTS "task_flows_blocks_proc_task_p_path_idx" ON "task_flows_blocks_proc_task_p" ("_path");
CREATE INDEX IF NOT EXISTS "task_flows_blocks_proc_task_p_locale_idx" ON "task_flows_blocks_proc_task_p" ("_locale");
DO $$ BEGIN
 ALTER TABLE "task_flows_blocks_proc_task_p" ADD CONSTRAINT "task_flows_blocks_proc_task_p_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_flows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_flows_blocks_proc_task_p_locales" ADD CONSTRAINT "task_flows_blocks_proc_task_p_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_flows_blocks_proc_task_p"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
`);
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 DROP TABLE "task_flows_blocks_proc_task_p";
DROP TABLE "task_flows_blocks_proc_task_p_locales";`);
}
