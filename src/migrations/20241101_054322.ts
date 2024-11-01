import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';
import { integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { groupBy, orderBy } from 'lodash-es';
import { eq } from 'drizzle-orm';

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const activitiesRelsTable = pgTable('activities_rels', {
    id: serial('id').primaryKey(),
    order: integer('order').notNull(),
    parent_id: integer('parent_id').notNull(),
    task_flows_id: integer('task_flows_id').notNull(),
    task_lists_id: integer('task_lists_id').notNull(),
    path: varchar('path').notNull(),
    locale: varchar('locale').notNull(),
  });

  let relations = await payload.db.drizzle.select().from(activitiesRelsTable);

  const relationsMutated: any[] = [];

  relations = orderBy(relations, ['path', 'order'], ['asc', 'asc']);

  const relationsGrouped = groupBy(relations, (item) => item.parent_id);

  Object.keys(relationsGrouped).forEach((k) => {
    const groupedByBlockId = groupBy(relationsGrouped[k], (item) => item.path.split('.')[1]);
    const newItems: {
      path: string;
      order: number;
      id: number;
      parent_id: number;
      task_flows_id: number;
      task_lists_id: number;
      locale: string;
    }[] = [];

    Object.keys(groupedByBlockId).forEach((kkk) => {
      groupedByBlockId[kkk].forEach((item, idx) => {
        newItems.push({
          ...item,
          path: item.path.replace('flowRelation', 'tasks').replace('listRelation', 'tasks'),
          order: idx + 1,
        });
      });
    });

    newItems.forEach((item) => {
      relationsMutated.push(item);
    });
  });

  for (const relation of relationsMutated) {
    const { id, path, order } = relation;
    await payload.db.drizzle
      .update(activitiesRelsTable)
      .set({
        path,
        order,
      })
      .where(eq(activitiesRelsTable.id, id));
  }

  payload.logger.info({
    msg: 'Activity blocks relations before',
    info: [relations.length, relationsMutated.length],
  });
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  payload.logger.info({ msg: 'ActivitiesMigration: Revert is not supported' });
}
