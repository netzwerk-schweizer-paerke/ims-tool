import { getLocalizedValue } from '@/lib/locale-utils'
import {
  ReadCloneSourceArgs,
  ReadCloneSourceResult,
} from '@/payload/utilities/cloning/create-clone-endpoint'
import { scanTaskForDocumentIds } from '@/payload/utilities/cloning/document-scanner'

type TaskCollectionSlug = 'task-flows' | 'task-lists'

/**
 * Phase 1 of a task flow or task list clone: the report name and the document ids of every locale.
 *
 * Phase 2 reads the source again per locale inside `cloneTaskFlowOrList`, so nothing is retained.
 */
export const readTaskSource = async (
  collectionSlug: TaskCollectionSlug,
  { cloneLocales, locale, req, sourceId }: ReadCloneSourceArgs,
): Promise<ReadCloneSourceResult<undefined>> => {
  // The name for the report only. `locale: 'all'` returns every locale, because a record
  // named in French alone has no German name and the report would show `undefined`.
  const source = await req.payload.findByID({
    collection: collectionSlug,
    depth: 0,
    id: sourceId,
    locale: 'all',
    req,
  })

  const name = getLocalizedValue(source.name, cloneLocales, locale)
  const documentIds: number[] = []

  // Read every locale, so a document that only a French rich text names still reaches
  // the preload. `false` is the only value that turns the fallback off.
  for (const cloneLocale of cloneLocales) {
    const localeSource = await req.payload.findByID({
      collection: collectionSlug,
      depth: 0,
      fallbackLocale: false,
      id: sourceId,
      locale: cloneLocale,
      req,
    })

    documentIds.push(...scanTaskForDocumentIds(collectionSlug, localeSource))
  }

  return { documentIds, name, source: undefined }
}
