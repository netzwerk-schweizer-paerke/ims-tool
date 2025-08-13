import type {
  CollectionSlug,
  GlobalSlug,
  PayloadHandler,
  PayloadRequest,
  TypedLocale,
} from 'payload'
import { APIError } from 'payload'

import { translateOperation } from '../operations/translate-operation'
import { relationshipCollector } from '../collectors/relationship-collector'
import { collectRelationships } from '../operations/collect-relationships'
import { findEntityWithConfig } from '../utilities/find-entity-with-config'

type SimpleTranslateArgs = {
  id: string | number
  collectionSlug?: CollectionSlug
  globalSlug?: GlobalSlug
  fromLocale: TypedLocale
  toLocale: TypedLocale
  includeRelationships?: boolean
  relationshipDepth?: number
}

/**
 * Transaction-safe translation endpoint
 * Ensures all translations are committed together or rolled back on failure
 */
export const translateEndpoint: PayloadHandler = async (req) => {
  if (!req.user) {
    throw new APIError('Not authorized', 403)
  }
  if (!req.json) {
    throw new APIError('Content-Type should be json')
  }

  const args: SimpleTranslateArgs = await req.json()

  const {
    id,
    collectionSlug,
    globalSlug,
    fromLocale,
    toLocale,
    includeRelationships = false,
    relationshipDepth = 1,
  } = args

  if (!collectionSlug && !globalSlug) {
    throw new APIError('Either collectionSlug or globalSlug is required', 400)
  }

  if (!fromLocale || !toLocale) {
    throw new APIError('Both fromLocale and toLocale are required', 400)
  }

  // Start a database transaction
  const transactionID = await req.payload.db.beginTransaction()

  if (!transactionID) {
    throw new APIError('Failed to start database transaction', 500)
  }

  try {
    // Create a new request object with the transaction ID
    const transactionalReq: PayloadRequest = {
      ...req,
      transactionID,
    }

    // Step 1: Translate the main document first (without relationships)

    const result = await translateOperation({
      id,
      collectionSlug,
      globalSlug,
      locale: toLocale,
      localeFrom: fromLocale,
      overrideAccess: true,
      req: transactionalReq, // Use transactional request
      update: true,
      emptyOnly: false,
      includeRelationships: false,
      relationshipDepth: 0,
    })

    if (!result.success) {
      throw new APIError('Main document translation failed', 500)
    }

    // Step 2: If relationships should be included, collect and translate them
    let relationshipStats = {
      total: 0,
      success: 0,
      failed: 0,
      failedDocs: [] as string[],
    }

    if (includeRelationships && relationshipDepth > 0) {
      // Start collecting
      relationshipCollector.startCollecting()

      // Fetch the source document with minimal depth for relationship IDs
      const { config, doc: sourceDoc } = await findEntityWithConfig({
        id,
        collectionSlug,
        globalSlug,
        locale: fromLocale,
        req: transactionalReq, // Use transactional request
        depth: 1, // Only need depth 1 to get relationship IDs, not full population
      })

      // Collect all relationships
      await collectRelationships({
        doc: sourceDoc,
        fields: config.fields,
        depth: relationshipDepth,
        path: collectionSlug || globalSlug || 'root',
      })

      // Get collected documents
      const relatedDocuments = relationshipCollector.stopCollecting()

      relationshipStats.total = relatedDocuments.length

      // Step 3: Translate each collected document within the transaction
      for (const relatedDoc of relatedDocuments) {
        try {
          await translateOperation({
            id: relatedDoc.id,
            collectionSlug: relatedDoc.collectionSlug as CollectionSlug,
            locale: toLocale,
            localeFrom: fromLocale,
            overrideAccess: true,
            req: transactionalReq, // Use transactional request
            update: true,
            emptyOnly: false,
            includeRelationships: false,
            relationshipDepth: 0,
          })

          relationshipStats.success++
        } catch (error: any) {
          relationshipStats.failed++
          relationshipStats.failedDocs.push(`${relatedDoc.collectionSlug}/${relatedDoc.id}`)

          // ANY failure should trigger rollback to ensure data consistency
          throw new APIError(
            `Failed to translate relationship ${relatedDoc.collectionSlug}/${relatedDoc.id}: ${error.message}`,
            500,
          )
        }
      }

      // Clear the collector for next use
      relationshipCollector.clear()
    }

    // If we've made it this far, commit the transaction
    await req.payload.db.commitTransaction(transactionID)

    // Return success with statistics
    return Response.json({
      success: true,
      message: `Document translated from ${fromLocale} to ${toLocale}`,
      id,
      collection: collectionSlug || globalSlug,
      statistics: {
        mainDocument: 'translated',
        relationships: relationshipStats,
      },
    })
  } catch (error: any) {
    // If anything goes wrong, rollback the entire transaction
    await req.payload.db.rollbackTransaction(transactionID)

    // Clear the collector in case of error
    relationshipCollector.clear()

    req.payload.logger.error({
      msg: 'Translation failed - transaction rolled back',
      error: error.message || 'Unknown error',
      id,
      collection: collectionSlug || globalSlug,
      transactionID,
    })

    throw new APIError(
      `Translation failed and was rolled back: ${error.message || 'Unknown error'}`,
      error.status || 500,
    )
  }
}
