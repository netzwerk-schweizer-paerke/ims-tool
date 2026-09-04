import { PayloadRequest, TypedLocale } from 'payload'

import {
  scanActivityForTaskRelations,
  scanTaskForDocumentIds,
  TaskRelationRef,
} from './document-scanner'

/**
 * Answers the document ids of every task the given activity locales name, read in every locale.
 *
 * A block names a task in the locale that holds the block, while the task carries locales of its
 * own. Phase 2 copies each task in every locale, so phase 1 must read them all, or a document a
 * French keypoint alone links never reaches the preload.
 */
export const scanNestedTaskDocumentIds = async (
  req: PayloadRequest,
  activitySources: Iterable<unknown>,
  locales: TypedLocale[],
): Promise<number[]> => {
  const tasks = new Map<string, TaskRelationRef>()

  for (const source of activitySources) {
    for (const relation of scanActivityForTaskRelations(source)) {
      tasks.set(`${relation.collection}:${relation.id}`, relation)
    }
  }

  const documentIds: number[] = []

  for (const { collection, id } of tasks.values()) {
    for (const locale of locales) {
      // `false` is the only value that turns the fallback off. `null` turns it on.
      const task = await req.payload.findByID({
        collection,
        depth: 0,
        fallbackLocale: false,
        id,
        locale,
        req,
      })

      documentIds.push(...scanTaskForDocumentIds(collection, task))
    }
  }

  return documentIds
}
