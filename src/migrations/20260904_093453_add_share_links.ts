import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
   CREATE TYPE "public"."enum_share_links_target_type" AS ENUM('activityBlock', 'activityLandscape', 'flow', 'list');
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE TABLE IF NOT EXISTS "share_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"token" varchar NOT NULL,
  	"created_by_id" integer NOT NULL,
  	"organisation_id" integer NOT NULL,
  	"target_type" "enum_share_links_target_type" NOT NULL,
  	"activity_id" integer,
  	"block_id" varchar,
  	"task_flow_id" integer,
  	"task_list_id" integer,
  	"locale" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "share_links_id" integer;

  DO $$ BEGIN
   ALTER TABLE "share_links" ADD CONSTRAINT "share_links_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "share_links" ADD CONSTRAINT "share_links_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "share_links" ADD CONSTRAINT "share_links_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "share_links" ADD CONSTRAINT "share_links_task_flow_id_task_flows_id_fk" FOREIGN KEY ("task_flow_id") REFERENCES "public"."task_flows"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "share_links" ADD CONSTRAINT "share_links_task_list_id_task_lists_id_fk" FOREIGN KEY ("task_list_id") REFERENCES "public"."task_lists"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE UNIQUE INDEX IF NOT EXISTS "share_links_token_idx" ON "share_links" USING btree ("token");
  CREATE INDEX IF NOT EXISTS "share_links_created_by_idx" ON "share_links" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "share_links_organisation_idx" ON "share_links" USING btree ("organisation_id");
  CREATE INDEX IF NOT EXISTS "share_links_activity_idx" ON "share_links" USING btree ("activity_id");
  CREATE INDEX IF NOT EXISTS "share_links_task_flow_idx" ON "share_links" USING btree ("task_flow_id");
  CREATE INDEX IF NOT EXISTS "share_links_task_list_idx" ON "share_links" USING btree ("task_list_id");
  CREATE INDEX IF NOT EXISTS "share_links_updated_at_idx" ON "share_links" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "share_links_created_at_idx" ON "share_links" USING btree ("created_at");

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_share_links_fk" FOREIGN KEY ("share_links_id") REFERENCES "public"."share_links"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_share_links_id_idx" ON "payload_locked_documents_rels" USING btree ("share_links_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_share_links_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_share_links_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "share_links_id";
  DROP TABLE IF EXISTS "share_links" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_share_links_target_type";`)
}
