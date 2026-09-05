import { Endpoint } from 'payload'

import { getDefaultLocaleCode, toContentLocale } from '@/lib/locale-utils'
import { buildParkIndex } from '@/lib/search/build-park-index'
import { collectDocumentParents } from '@/lib/search/collect-document-parents'
import { ParkSearchIndex } from '@/lib/search/types'
import { getErrorStatus } from '@/payload/utilities/cloning/clone-http-error'
import { getErrorMessage } from '@/payload/utilities/cloning/error-utils'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

/**
 * The searchable content of the caller's park, flattened to plain text.
 *
 * The client fetches this once and filters it in the browser. It takes no organisation id:
 * every read passes `overrideAccess: false`, so the collection access rule scopes the park.
 */
export const parkSearchEndpoint: Endpoint = {
  handler: async (req) => {
    requireAuthentication(req)

    // A super admin with no selected park reads every park, because
    // `currentOrganisationCollectionReadAccess` returns `true` on that branch. The search covers
    // one park, so it refuses instead of indexing all of them.
    if (getIdFromRelation(req.user?.selectedOrganisation) === null) {
      return Response.json({ error: 'No organisation selected' }, { status: 400 })
    }

    // `req.locale` follows the admin language, which includes `en`. A query needs a content
    // locale, and a block id belongs to one locale. See `block-id-is-per-locale`.
    const locale = toContentLocale(req.locale, req.payload.config)
    const shared = { depth: 0, limit: 0, locale, overrideAccess: false, req } as const

    try {
      const [activities, documents, taskFlows, taskLists] = await Promise.all([
        req.payload.find({ ...shared, collection: 'activities' }),
        req.payload.find({ ...shared, collection: 'documents' }),
        req.payload.find({ ...shared, collection: 'task-flows' }),
        req.payload.find({ ...shared, collection: 'task-lists' }),
      ])

      const index: ParkSearchIndex = {
        hits: buildParkIndex({
          activities: activities.docs,
          // A document row carries a file name alone, so the walk names the record that uses it.
          documentParents: collectDocumentParents({
            activities: activities.docs,
            taskFlows: taskFlows.docs,
            taskLists: taskLists.docs,
          }),
          documents: documents.docs,
          taskFlows: taskFlows.docs,
          taskLists: taskLists.docs,
        }),
        locale: locale ?? getDefaultLocaleCode(req.payload.config),
      }

      return Response.json(index, { status: 200 })
    } catch (error) {
      const status = getErrorStatus(error)

      req.payload.logger.error({
        error: getErrorMessage(error),
        msg: 'Park search index failed',
        status,
        userId: req.user?.id,
      })

      return Response.json({ error: `Park search failed: ${getErrorMessage(error)}` }, { status })
    }
  },
  method: 'get',
  path: '/park-search',
}
