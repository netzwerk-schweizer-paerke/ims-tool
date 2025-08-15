import type {
  CollectionSlug,
  PayloadHandler,
  PayloadRequest,
} from 'payload'
import { APIError } from 'payload'
import { ZodError } from 'zod'

import { translateOperation } from '../operations/translate-operation'
import { relationshipCollector } from '../collectors/relationship-collector'
import { collectRelationships } from '../operations/collect-relationships'
import { findEntityWithConfig } from '../utilities/find-entity-with-config'
import { validateTranslateArgs, type ValidatedTranslateArgs } from '../schemas/translate-endpoint'

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

  // Parse and validate request body with Zod schema
  let validatedArgs: ValidatedTranslateArgs
  try {
    const rawArgs = await req.json()
    validatedArgs = await validateTranslateArgs(rawArgs)
  } catch (error) {
    if (error instanceof ZodError) {
      // Format Zod validation errors into a user-friendly message
      const errorMessages = error.issues.map((err: any) => {
        const path = err.path.length > 0 ? ` (${err.path.join('.')})` : ''
        return `${err.message}${path}`
      }).join('; ')
      
      throw new APIError(`Validation failed: ${errorMessages}`, 400)
    }
    // Re-throw other errors (JSON parsing, etc.)
    throw error
  }

  const {
    id,
    collectionSlug,
    globalSlug,
    fromLocale,
    toLocale,
    includeRelationships,
    relationshipDepth,
  } = validatedArgs

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
      collectionSlug: collectionSlug as CollectionSlug | undefined,
      globalSlug: globalSlug as any, // GlobalSlug type is not available, using any
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
      // Handle different error types with appropriate HTTP status codes
      if (result.error?.type === 'quota_exceeded') {
        throw new APIError(result.error.message, 429) // Too Many Requests for quota
      } else if (result.error?.type === 'authentication') {
        throw new APIError(result.error.message, 401) // Unauthorized
      } else if (result.error?.type === 'network') {
        throw new APIError(result.error.message, 502) // Bad Gateway for network issues
      } else {
        throw new APIError(result.error?.message || 'Main document translation failed', 500)
      }
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
        collectionSlug: collectionSlug as CollectionSlug | undefined,
        globalSlug: globalSlug as any,
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
          const relationshipResult = await translateOperation({
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

          if (!relationshipResult.success) {
            // Handle different error types for relationships
            if (relationshipResult.error?.type === 'quota_exceeded') {
              throw new APIError(relationshipResult.error.message, 429)
            } else if (relationshipResult.error?.type === 'authentication') {
              throw new APIError(relationshipResult.error.message, 401)
            } else if (relationshipResult.error?.type === 'network') {
              throw new APIError(relationshipResult.error.message, 502)
            } else {
              throw new APIError(
                relationshipResult.error?.message || `Failed to translate relationship ${relatedDoc.collectionSlug}/${relatedDoc.id}`,
                500,
              )
            }
          }

          relationshipStats.success++
        } catch (error: any) {
          relationshipStats.failed++
          relationshipStats.failedDocs.push(`${relatedDoc.collectionSlug}/${relatedDoc.id}`)

          // ANY failure should trigger rollback to ensure data consistency
          // Preserve the original error message and status code if it's an APIError
          if (error instanceof APIError) {
            throw error
          } else {
            throw new APIError(
              `Failed to translate relationship ${relatedDoc.collectionSlug}/${relatedDoc.id}: ${error.message}`,
              500,
            )
          }
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
