import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_organisations_organisation_language" AS ENUM('en', 'fr', 'de', 'it');
  ALTER TABLE "organisations" ADD COLUMN "organisation_language" "enum_organisations_organisation_language" DEFAULT 'de';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "organisations" DROP COLUMN IF EXISTS "organisation_language";
  DROP TYPE "public"."enum_organisations_organisation_language";`)
}
