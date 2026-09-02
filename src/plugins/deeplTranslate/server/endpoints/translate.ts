import type { CollectionSlug, GlobalSlug, PayloadHandler, PayloadRequest } from 'payload'

import { APIError } from 'payload'
import { ZodError } from 'zod'

import type { TranslateSuccessResponse } from '../../translate-response-schema'

import { createRelationshipCollector } from '../collectors/relationship-collector'
import { collectRelationships } from '../operations/collect-relationships'
import { translateOperation, writeTranslation } from '../operations/translate-operation'
import { type ValidatedTranslateArgs, validateTranslateArgs } from '../schemas/translate-endpoint'
import { findEntityWithConfig } from '../utilities/find-entity-with-config'
import { validateTranslateAccess } from '../utilities/validate-translate-access'

type TranslateTarget = {
  collectionSlug?: CollectionSlug
  globalSlug?: GlobalSlug
  id?: number | string
}

/** Narrows an unknown thrown value so the code can read a property off it. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** Maps a resolver error type onto the HTTP status the client expects. */
const statusForErrorType = (type: string | undefined): number => {
  switch (type) {
    case 'authentication': {
      return 401
    }
    case 'network': {
      return 502
    }
    case 'quota_exceeded': {
      return 429
    }
    default: {
      return 500
    }
  }
}

/**
 * Translation endpoint.
 *
 * The work runs in three phases. The endpoint decides the document set, then calls DeepL
 * for every document, then opens one transaction and writes them all. The transaction
 * therefore never stays open across a network call.
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
      const errorMessages = error.issues
        .map((err) => {
          const path = err.path.length > 0 ? ` (${err.path.join('.')})` : ''
          return `${err.message}${path}`
        })
        .join('; ')

      throw new APIError(`Validation failed: ${errorMessages}`, 400)
    }
    // Re-throw other errors (JSON parsing, etc.)
    throw error
  }

  const {
    collectionSlug,
    fromLocale,
    globalSlug,
    id,
    includeRelationships,
    relationshipDepth,
    toLocale,
  } = validatedArgs

  // The request schema refines that exactly one of the two is present, so this never
  // fires. It narrows the union for the response type without a cast.
  const collection = collectionSlug ?? globalSlug
  if (!collection) {
    throw new APIError('Either collectionSlug or globalSlug must be provided', 400)
  }

  const access = await validateTranslateAccess({ collectionSlug, globalSlug, id, req })

  if (!access.isValid) {
    throw new APIError(access.message ?? 'Access denied', access.status ?? 403)
  }

  const relationshipStats = {
    failed: 0,
    failedDocs: [] as string[],
    skipped: 0,
    success: 0,
    total: 0,
  }

  // Phase 1: decide which documents to translate. The main document comes first.
  // This project registers no globals, so `GlobalSlug` is `never` and the assertion
  // narrows `globalSlug` to `undefined`. It keeps working once a global is registered.
  const targets: TranslateTarget[] = [
    {
      collectionSlug: collectionSlug as CollectionSlug | undefined,
      globalSlug: globalSlug as GlobalSlug | undefined,
      id,
    },
  ]

  if (includeRelationships && relationshipDepth > 0) {
    // One collector per request. A shared instance let two concurrent translations
    // overwrite each other's collected ids.
    const collector = createRelationshipCollector()

    // Fetch the source document with minimal depth for relationship IDs
    const { config, doc: sourceDoc } = await findEntityWithConfig({
      collectionSlug: collectionSlug as CollectionSlug | undefined,
      depth: 1, // Only need depth 1 to get relationship IDs, not full population
      globalSlug: globalSlug as GlobalSlug | undefined,
      id,
      locale: fromLocale,
      req,
    })

    await collectRelationships({
      collector,
      depth: relationshipDepth,
      doc: sourceDoc,
      fields: config.fields,
      path: collectionSlug || globalSlug || 'root',
    })

    const relatedDocuments = collector.getDocuments()

    relationshipStats.total = relatedDocuments.length

    for (const relatedDoc of relatedDocuments) {
      // The write below uses `overrideAccess: true`, so this check is the only gate on it.
      const relatedAccess = await validateTranslateAccess({
        collectionSlug: relatedDoc.collectionSlug,
        id: relatedDoc.id,
        req,
      })

      // A skip is not a failure. `addDocument` accepts only task-lists and task-flows,
      // so a skip means a task the caller may not translate, such as one in another
      // organisation. The response reports the count.
      if (!relatedAccess.isValid) {
        relationshipStats.skipped++
        continue
      }

      targets.push({
        collectionSlug: relatedDoc.collectionSlug as CollectionSlug,
        id: relatedDoc.id,
      })
    }
  }

  // Phase 2: call DeepL for every document. No transaction is open here, and
  // `update: false` means nothing is written yet.
  const prepared: Array<{ target: TranslateTarget; translatedData: Record<string, unknown> }> = []

  for (const [index, target] of targets.entries()) {
    const isMainDocument = index === 0
    const label = `${target.collectionSlug ?? target.globalSlug}/${target.id}`

    let result

    try {
      result = await translateOperation({
        collectionSlug: target.collectionSlug,
        emptyOnly: false,
        globalSlug: target.globalSlug,
        id: target.id,
        includeRelationships: false,
        locale: toLocale,
        localeFrom: fromLocale,
        overrideAccess: true,
        relationshipDepth: 0,
        req,
        update: false,
      })
    } catch (error: unknown) {
      if (!isMainDocument) {
        relationshipStats.failed++
        relationshipStats.failedDocs.push(label)
      }
      if (error instanceof APIError) {
        throw error
      }
      const message = error instanceof Error ? error.message : String(error)
      throw new APIError(
        isMainDocument
          ? `Main document translation failed: ${message}`
          : `Failed to translate relationship ${label}: ${message}`,
        500,
      )
    }

    if (!result.success) {
      if (!isMainDocument) {
        relationshipStats.failed++
        relationshipStats.failedDocs.push(label)
      }
      throw new APIError(
        result.error?.message ??
          (isMainDocument
            ? 'Main document translation failed'
            : `Failed to translate relationship ${label}`),
        statusForErrorType(result.error?.type),
      )
    }

    prepared.push({ target, translatedData: result.translatedData })
  }

  // Phase 3: write every translated document in one transaction.
  const transactionID = await req.payload.db.beginTransaction()

  if (!transactionID) {
    throw new APIError('Failed to start database transaction', 500)
  }

  try {
    const transactionalReq: PayloadRequest = {
      ...req,
      transactionID,
    }

    for (const { target, translatedData } of prepared) {
      await writeTranslation({
        collectionSlug: target.collectionSlug,
        globalSlug: target.globalSlug,
        id: target.id,
        locale: toLocale,
        localeFrom: fromLocale,
        overrideAccess: true,
        req: transactionalReq,
        translatedData,
      })
    }

    await req.payload.db.commitTransaction(transactionID)
  } catch (error: unknown) {
    // If anything goes wrong, rollback the entire transaction
    await req.payload.db.rollbackTransaction(transactionID)

    // `status` is read off the value, not off `Error`, so an APIError keeps its own code.
    const message = error instanceof Error ? error.message : ''
    const status = isRecord(error) && typeof error.status === 'number' ? error.status : 0

    req.payload.logger.error({
      collection,
      error: message || 'Unknown error',
      id,
      msg: 'Translation failed - transaction rolled back',
      transactionID,
    })

    throw new APIError(
      `Translation failed and was rolled back: ${message || 'Unknown error'}`,
      status || 500,
    )
  }

  // The main document is the first target, so the rest are relationships.
  relationshipStats.success = prepared.length - 1

  // A skipped relationship must reach the caller. Otherwise a partial translation
  // reports the same success as a complete one.
  const skipNotice =
    relationshipStats.skipped > 0
      ? `. ${relationshipStats.skipped} related document(s) were skipped, because you may not translate them`
      : ''

  // `satisfies` makes a drift from the shared contract fail the type check here, at the
  // source. The client parses the same schema at runtime, because the wire is untyped.
  const body = {
    collection,
    id,
    message: `Document translated from ${fromLocale} to ${toLocale}${skipNotice}`,
    statistics: {
      mainDocument: 'translated',
      relationships: relationshipStats,
    },
    success: true,
  } satisfies TranslateSuccessResponse

  return Response.json(body)
}
