import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 CREATE TABLE IF NOT EXISTS "documents_public" (
	"id" serial PRIMARY KEY NOT NULL,
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

CREATE TABLE IF NOT EXISTS "documents_public_locales" (
	"description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL,
	CONSTRAINT "documents_public_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

ALTER TABLE "media" ALTER COLUMN "prefix" SET DEFAULT 'media';
ALTER TABLE "documents" ALTER COLUMN "prefix" SET DEFAULT 'documents';
ALTER TABLE "users" ALTER COLUMN "login_attempts" SET DEFAULT 0;
DO $$ BEGIN
 ALTER TABLE "documents_public_locales" ADD CONSTRAINT "documents_public_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."documents_public"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "documents_public_created_at_idx" ON "documents_public" USING btree ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "documents_public_filename_idx" ON "documents_public" USING btree ("filename");`);
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 DROP TABLE "documents_public";
DROP TABLE "documents_public_locales";
ALTER TABLE "media" ALTER COLUMN "prefix" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "prefix" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "login_attempts" DROP DEFAULT;`);
}
