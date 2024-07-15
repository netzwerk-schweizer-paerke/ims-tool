import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 DO $$ BEGIN
 CREATE TYPE "_locales" AS ENUM('en', 'de', 'fr', 'it');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "enum_activities_variant" AS ENUM('standard', 'group');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "enum_users_roles" AS ENUM('admin', 'user');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "enum_users_organisations_roles" AS ENUM('admin', 'user');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"organisation_id" integer,
	"created_by_id" integer,
	"updated_by_id" integer,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"url" varchar,
	"thumbnail_u_r_l" varchar,
	"filename" varchar,
	"mime_type" varchar,
	"filesize" numeric,
	"width" numeric,
	"height" numeric,
	"focal_x" numeric,
	"focal_y" numeric,
	"sizes_thumbnail_url" varchar,
	"sizes_thumbnail_width" numeric,
	"sizes_thumbnail_height" numeric,
	"sizes_thumbnail_mime_type" varchar,
	"sizes_thumbnail_filesize" numeric,
	"sizes_thumbnail_filename" varchar,
	"sizes_card_url" varchar,
	"sizes_card_width" numeric,
	"sizes_card_height" numeric,
	"sizes_card_mime_type" varchar,
	"sizes_card_filesize" numeric,
	"sizes_card_filename" varchar,
	"sizes_tablet_url" varchar,
	"sizes_tablet_width" numeric,
	"sizes_tablet_height" numeric,
	"sizes_tablet_mime_type" varchar,
	"sizes_tablet_filesize" numeric,
	"sizes_tablet_filename" varchar
);

CREATE TABLE IF NOT EXISTS "media_locales" (
	"name" varchar,
	"description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL,
	CONSTRAINT "media_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "organisations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar,
	"created_by_id" integer,
	"updated_by_id" integer,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "activities_blocks_activity_io" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"_locale" "_locales" NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
);

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

CREATE TABLE IF NOT EXISTS "activities_blocks_activity_task" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"_locale" "_locales" NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
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

CREATE TABLE IF NOT EXISTS "activities_files" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "activities_files_locales" (
	"document_id" integer,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL,
	CONSTRAINT "activities_files_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"variant" "enum_activities_variant" NOT NULL,
	"organisation_id" integer,
	"created_by_id" integer,
	"updated_by_id" integer,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "activities_locales" (
	"name" varchar NOT NULL,
	"description" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL,
	CONSTRAINT "activities_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "activities_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"task_flows_id" integer,
	"task_lists_id" integer
);

CREATE TABLE IF NOT EXISTS "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"organisation_id" integer,
	"created_by_id" integer,
	"updated_by_id" integer,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"url" varchar,
	"thumbnail_u_r_l" varchar,
	"filename" varchar,
	"mime_type" varchar,
	"filesize" numeric,
	"width" numeric,
	"height" numeric,
	"focal_x" numeric,
	"focal_y" numeric
);

CREATE TABLE IF NOT EXISTS "documents_locales" (
	"name" varchar,
	"description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL,
	CONSTRAINT "documents_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "task_flows_blocks_proc_task_io" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"_locale" "_locales" NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
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

CREATE TABLE IF NOT EXISTS "task_flows_blocks_proc_test" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"_locale" "_locales" NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
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

CREATE TABLE IF NOT EXISTS "task_flows_files" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "task_flows_files_locales" (
	"document_id" integer,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL,
	CONSTRAINT "task_flows_files_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "task_flows" (
	"id" serial PRIMARY KEY NOT NULL,
	"organisation_id" integer,
	"created_by_id" integer,
	"updated_by_id" integer,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "task_flows_locales" (
	"name" varchar NOT NULL,
	"description" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL,
	CONSTRAINT "task_flows_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "task_lists_items" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_locale" "_locales" NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
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

CREATE TABLE IF NOT EXISTS "task_lists_files" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "task_lists_files_locales" (
	"document_id" integer,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL,
	CONSTRAINT "task_lists_files_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "task_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"organisation_id" integer,
	"created_by_id" integer,
	"updated_by_id" integer,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "task_lists_locales" (
	"name" varchar NOT NULL,
	"description" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL,
	CONSTRAINT "task_lists_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "users_roles" (
	"order" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"value" "enum_users_roles",
	"id" serial PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "users_organisations_roles" (
	"order" integer NOT NULL,
	"parent_id" varchar NOT NULL,
	"value" "enum_users_organisations_roles",
	"id" serial PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "users_organisations" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"organisation_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"selected_organisation_id" integer,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"email" varchar NOT NULL,
	"reset_password_token" varchar,
	"reset_password_expiration" timestamp(3) with time zone,
	"salt" varchar,
	"hash" varchar,
	"login_attempts" numeric,
	"lock_until" timestamp(3) with time zone
);

CREATE TABLE IF NOT EXISTS "payload_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"value" jsonb,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"users_id" integer
);

CREATE TABLE IF NOT EXISTS "payload_migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"batch" numeric,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" ("filename");
CREATE INDEX IF NOT EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" ("sizes_thumbnail_filename");
CREATE INDEX IF NOT EXISTS "media_sizes_card_sizes_card_filename_idx" ON "media" ("sizes_card_filename");
CREATE INDEX IF NOT EXISTS "media_sizes_tablet_sizes_tablet_filename_idx" ON "media" ("sizes_tablet_filename");
CREATE INDEX IF NOT EXISTS "organisations_created_at_idx" ON "organisations" ("created_at");
CREATE INDEX IF NOT EXISTS "activities_blocks_activity_io_order_idx" ON "activities_blocks_activity_io" ("_order");
CREATE INDEX IF NOT EXISTS "activities_blocks_activity_io_parent_id_idx" ON "activities_blocks_activity_io" ("_parent_id");
CREATE INDEX IF NOT EXISTS "activities_blocks_activity_io_path_idx" ON "activities_blocks_activity_io" ("_path");
CREATE INDEX IF NOT EXISTS "activities_blocks_activity_io_locale_idx" ON "activities_blocks_activity_io" ("_locale");
CREATE INDEX IF NOT EXISTS "activities_blocks_activity_task_order_idx" ON "activities_blocks_activity_task" ("_order");
CREATE INDEX IF NOT EXISTS "activities_blocks_activity_task_parent_id_idx" ON "activities_blocks_activity_task" ("_parent_id");
CREATE INDEX IF NOT EXISTS "activities_blocks_activity_task_path_idx" ON "activities_blocks_activity_task" ("_path");
CREATE INDEX IF NOT EXISTS "activities_blocks_activity_task_locale_idx" ON "activities_blocks_activity_task" ("_locale");
CREATE INDEX IF NOT EXISTS "activities_files_order_idx" ON "activities_files" ("_order");
CREATE INDEX IF NOT EXISTS "activities_files_parent_id_idx" ON "activities_files" ("_parent_id");
CREATE INDEX IF NOT EXISTS "activities_created_at_idx" ON "activities" ("created_at");
CREATE INDEX IF NOT EXISTS "activities_rels_order_idx" ON "activities_rels" ("order");
CREATE INDEX IF NOT EXISTS "activities_rels_parent_idx" ON "activities_rels" ("parent_id");
CREATE INDEX IF NOT EXISTS "activities_rels_path_idx" ON "activities_rels" ("path");
CREATE INDEX IF NOT EXISTS "documents_created_at_idx" ON "documents" ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "documents_filename_idx" ON "documents" ("filename");
CREATE INDEX IF NOT EXISTS "task_flows_blocks_proc_task_io_order_idx" ON "task_flows_blocks_proc_task_io" ("_order");
CREATE INDEX IF NOT EXISTS "task_flows_blocks_proc_task_io_parent_id_idx" ON "task_flows_blocks_proc_task_io" ("_parent_id");
CREATE INDEX IF NOT EXISTS "task_flows_blocks_proc_task_io_path_idx" ON "task_flows_blocks_proc_task_io" ("_path");
CREATE INDEX IF NOT EXISTS "task_flows_blocks_proc_task_io_locale_idx" ON "task_flows_blocks_proc_task_io" ("_locale");
CREATE INDEX IF NOT EXISTS "task_flows_blocks_proc_test_order_idx" ON "task_flows_blocks_proc_test" ("_order");
CREATE INDEX IF NOT EXISTS "task_flows_blocks_proc_test_parent_id_idx" ON "task_flows_blocks_proc_test" ("_parent_id");
CREATE INDEX IF NOT EXISTS "task_flows_blocks_proc_test_path_idx" ON "task_flows_blocks_proc_test" ("_path");
CREATE INDEX IF NOT EXISTS "task_flows_blocks_proc_test_locale_idx" ON "task_flows_blocks_proc_test" ("_locale");
CREATE INDEX IF NOT EXISTS "task_flows_files_order_idx" ON "task_flows_files" ("_order");
CREATE INDEX IF NOT EXISTS "task_flows_files_parent_id_idx" ON "task_flows_files" ("_parent_id");
CREATE INDEX IF NOT EXISTS "task_flows_created_at_idx" ON "task_flows" ("created_at");
CREATE INDEX IF NOT EXISTS "task_lists_items_order_idx" ON "task_lists_items" ("_order");
CREATE INDEX IF NOT EXISTS "task_lists_items_parent_id_idx" ON "task_lists_items" ("_parent_id");
CREATE INDEX IF NOT EXISTS "task_lists_items_locale_idx" ON "task_lists_items" ("_locale");
CREATE INDEX IF NOT EXISTS "task_lists_files_order_idx" ON "task_lists_files" ("_order");
CREATE INDEX IF NOT EXISTS "task_lists_files_parent_id_idx" ON "task_lists_files" ("_parent_id");
CREATE INDEX IF NOT EXISTS "task_lists_created_at_idx" ON "task_lists" ("created_at");
CREATE INDEX IF NOT EXISTS "users_roles_order_idx" ON "users_roles" ("order");
CREATE INDEX IF NOT EXISTS "users_roles_parent_idx" ON "users_roles" ("parent_id");
CREATE INDEX IF NOT EXISTS "users_organisations_roles_order_idx" ON "users_organisations_roles" ("order");
CREATE INDEX IF NOT EXISTS "users_organisations_roles_parent_idx" ON "users_organisations_roles" ("parent_id");
CREATE INDEX IF NOT EXISTS "users_organisations_order_idx" ON "users_organisations" ("_order");
CREATE INDEX IF NOT EXISTS "users_organisations_parent_id_idx" ON "users_organisations" ("_parent_id");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" ("key");
CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" ("created_at");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" ("order");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" ("parent_id");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" ("path");
CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" ("created_at");
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "media"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "organisations" ADD CONSTRAINT "organisations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "organisations" ADD CONSTRAINT "organisations_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities_blocks_activity_io" ADD CONSTRAINT "activities_blocks_activity_io_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "activities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities_blocks_activity_io_locales" ADD CONSTRAINT "activities_blocks_activity_io_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "activities_blocks_activity_io"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities_blocks_activity_task" ADD CONSTRAINT "activities_blocks_activity_task_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "activities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities_blocks_activity_task_locales" ADD CONSTRAINT "activities_blocks_activity_task_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "activities_blocks_activity_task"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities_files" ADD CONSTRAINT "activities_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "activities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities_files_locales" ADD CONSTRAINT "activities_files_locales_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities_files_locales" ADD CONSTRAINT "activities_files_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "activities_files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities" ADD CONSTRAINT "activities_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities" ADD CONSTRAINT "activities_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities_locales" ADD CONSTRAINT "activities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "activities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities_rels" ADD CONSTRAINT "activities_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "activities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities_rels" ADD CONSTRAINT "activities_rels_task_flows_fk" FOREIGN KEY ("task_flows_id") REFERENCES "task_flows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities_rels" ADD CONSTRAINT "activities_rels_task_lists_fk" FOREIGN KEY ("task_lists_id") REFERENCES "task_lists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "documents_locales" ADD CONSTRAINT "documents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_flows_blocks_proc_task_io" ADD CONSTRAINT "task_flows_blocks_proc_task_io_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_flows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_flows_blocks_proc_task_io_locales" ADD CONSTRAINT "task_flows_blocks_proc_task_io_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_flows_blocks_proc_task_io"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_flows_blocks_proc_test" ADD CONSTRAINT "task_flows_blocks_proc_test_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_flows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_flows_blocks_proc_test_locales" ADD CONSTRAINT "task_flows_blocks_proc_test_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_flows_blocks_proc_test"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_flows_files" ADD CONSTRAINT "task_flows_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_flows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_flows_files_locales" ADD CONSTRAINT "task_flows_files_locales_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_flows_files_locales" ADD CONSTRAINT "task_flows_files_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_flows_files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_flows" ADD CONSTRAINT "task_flows_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_flows" ADD CONSTRAINT "task_flows_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_flows" ADD CONSTRAINT "task_flows_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_flows_locales" ADD CONSTRAINT "task_flows_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_flows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_lists_items" ADD CONSTRAINT "task_lists_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_lists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_lists_items_locales" ADD CONSTRAINT "task_lists_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_lists_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_lists_files" ADD CONSTRAINT "task_lists_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_lists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_lists_files_locales" ADD CONSTRAINT "task_lists_files_locales_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_lists_files_locales" ADD CONSTRAINT "task_lists_files_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_lists_files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_lists" ADD CONSTRAINT "task_lists_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_lists" ADD CONSTRAINT "task_lists_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_lists" ADD CONSTRAINT "task_lists_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "task_lists_locales" ADD CONSTRAINT "task_lists_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "task_lists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "users_organisations_roles" ADD CONSTRAINT "users_organisations_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "users_organisations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "users_organisations" ADD CONSTRAINT "users_organisations_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "users_organisations" ADD CONSTRAINT "users_organisations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_selected_organisation_id_organisations_id_fk" FOREIGN KEY ("selected_organisation_id") REFERENCES "organisations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
`);
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 DROP TABLE "media";
DROP TABLE "media_locales";
DROP TABLE "organisations";
DROP TABLE "activities_blocks_activity_io";
DROP TABLE "activities_blocks_activity_io_locales";
DROP TABLE "activities_blocks_activity_task";
DROP TABLE "activities_blocks_activity_task_locales";
DROP TABLE "activities_files";
DROP TABLE "activities_files_locales";
DROP TABLE "activities";
DROP TABLE "activities_locales";
DROP TABLE "activities_rels";
DROP TABLE "documents";
DROP TABLE "documents_locales";
DROP TABLE "task_flows_blocks_proc_task_io";
DROP TABLE "task_flows_blocks_proc_task_io_locales";
DROP TABLE "task_flows_blocks_proc_test";
DROP TABLE "task_flows_blocks_proc_test_locales";
DROP TABLE "task_flows_files";
DROP TABLE "task_flows_files_locales";
DROP TABLE "task_flows";
DROP TABLE "task_flows_locales";
DROP TABLE "task_lists_items";
DROP TABLE "task_lists_items_locales";
DROP TABLE "task_lists_files";
DROP TABLE "task_lists_files_locales";
DROP TABLE "task_lists";
DROP TABLE "task_lists_locales";
DROP TABLE "users_roles";
DROP TABLE "users_organisations_roles";
DROP TABLE "users_organisations";
DROP TABLE "users";
DROP TABLE "payload_preferences";
DROP TABLE "payload_preferences_rels";
DROP TABLE "payload_migrations";`);
}
