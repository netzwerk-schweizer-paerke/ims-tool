import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
   ALTER TABLE "activities" ADD COLUMN "input" jsonb;
  ALTER TABLE "activities" ADD COLUMN "output" jsonb;
  ALTER TABLE "activities" ADD COLUMN "norms" jsonb;
  ALTER TABLE "activities" ADD COLUMN "support" jsonb;`);
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
   ALTER TABLE "activities" DROP COLUMN IF EXISTS "input";
  ALTER TABLE "activities" DROP COLUMN IF EXISTS "output";
  ALTER TABLE "activities" DROP COLUMN IF EXISTS "norms";
  ALTER TABLE "activities" DROP COLUMN IF EXISTS "support";`);
}
