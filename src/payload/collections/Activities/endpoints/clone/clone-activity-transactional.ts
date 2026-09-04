import { TypedLocale } from 'payload'

import { Activity } from '@/payload-types'
import { cloneActivity } from '@/payload/collections/Activities/endpoints/clone/utils/clone-activity'
import { hasLocaleContent } from '@/payload/utilities/cloning/clone-locales'
import { createCloneEndpoint } from '@/payload/utilities/cloning/create-clone-endpoint'
import { scanActivityForDocumentIds } from '@/payload/utilities/cloning/document-scanner'
import { scanNestedTaskDocumentIds } from '@/payload/utilities/cloning/scan-nested-task-documents'

/** The source read once per locale, with the fallback off. Phase 2 writes from these reads. */
type SourcesByLocale = Map<TypedLocale, Activity>

export const cloneActivityTransactional = createCloneEndpoint<SourcesByLocale>({
  cloneSource: ({ cloneLocales, documentPreloader, req, source, sourceId, targetOrgId, tracker }) =>
    cloneActivity({
      documentPreloader,
      locales: cloneLocales,
      req,
      sourceId,
      sourcesByLocale: source,
      targetOrgId,
      tracker,
    }),
  collectionSlug: 'activities',
  // Phase 2 copies each nested task in every locale, so every locale of every nested task
  // must reach the preload as well.
  collectNestedDocumentIds: ({ cloneLocales, req, sources }) =>
    scanNestedTaskDocumentIds(
      req,
      sources.flatMap((sourcesByLocale) => Array.from(sourcesByLocale.values())),
      cloneLocales,
    ),
  label: { plural: 'activities', singular: 'Activity' },
  readSource: async ({ cloneLocales, locale, req, sourceId }) => {
    const documentIds: number[] = []
    const sourcesByLocale: SourcesByLocale = new Map()

    // Read every locale, so a document that only a French rich text names still reaches
    // the preload. The fallback would otherwise answer with the German content.
    for (const cloneLocale of cloneLocales) {
      const source = await req.payload.findByID({
        collection: 'activities',
        depth: 2, // Need depth for scanning nested content
        fallbackLocale: false,
        id: sourceId,
        locale: cloneLocale,
        req,
      })

      sourcesByLocale.set(cloneLocale, source)
      documentIds.push(...scanActivityForDocumentIds(source))
    }

    // The label of the report. It prefers the request locale, because 4 of 104 activities
    // have no German name and the panel would otherwise show `undefined`.
    const name =
      [locale, ...cloneLocales]
        .map((code) => sourcesByLocale.get(code))
        .find((source) => source && hasLocaleContent(source))?.name ?? ''

    return { documentIds, name, source: sourcesByLocale }
  },
})
