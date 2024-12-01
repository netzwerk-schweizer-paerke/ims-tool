import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 ALTER TYPE "enum_activities_variant" ADD VALUE 'supportActivity';
 ALTER TYPE "enum_activities_variant" ADD VALUE 'strategyActivity';`)
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
 ALTER TYPE "enum_activities_variant" ADD VALUE 'group';`)
}
