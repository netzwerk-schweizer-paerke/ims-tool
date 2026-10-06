import { Endpoint, PayloadRequest, TypedLocale } from 'payload'
import { z } from 'zod'

import { toContentLocale } from '@/lib/locale-utils'
import { getCloneLocales } from '@/payload/utilities/cloning/clone-locales'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'
import { runClonePipeline } from '@/payload/utilities/cloning/run-clone-pipeline'
import { taskPositionSchema } from '@/payload/utilities/cloning/task-position-schema'
import { GenericCloneStatisticsFinalized } from '@/payload/utilities/cloning/types'
import { formatValidationErrors } from '@/payload/utilities/cloning/validation-schemas'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'

const batchCloneBodySchema = z.object({
  ids: z.array(z.number().min(1)).min(1, 'At least one ID is required'),
  locale: z.string(),
  // A Thema pasted "Davor" or "Danach" a Thema of the target park (PIMS-83).
  position: z
    .object({ anchorActivityId: z.number().min(1), placement: z.enum(['after', 'before']) })
    .optional(),
  // A paste of a Prozess or a Liste names the Prozessgruppe that links the copy (PIMS-83).
  target: z
    .object({
      activityId: z.number().min(1),
      blockId: z.string().min(1),
      position: taskPositionSchema.optional(),
    })
    .optional(),
  targetOrganisationId: z.number(),
})

export type CloneableCollectionSlug = 'activities' | 'task-flows' | 'task-lists'

export type CloneEndpointBody = z.infer<typeof batchCloneBodySchema>

/**
 * What one cloneable collection contributes to `POST /api/<collection>/clone`.
 *
 * The handler owns the body, the access check, the two phases, the transaction and the cleanup.
 * A collection supplies only the reads of phase 1 and the write of phase 2.
 */
export interface CloneEndpointConfig<TSource> {
  /** Copies one source inside the transaction. `req` carries the transaction id. */
  cloneSource: (args: CloneSourceArgs<TSource>) => Promise<{ id: number; name: string }>
  collectionSlug: CloneableCollectionSlug
  /**
   * Runs once in phase 1, after every source is read. It answers the document ids that only a
   * nested record links, so that phase 2 finds their copies as well.
   */
  collectNestedDocumentIds?: (args: {
    cloneLocales: TypedLocale[]
    req: PayloadRequest
    sources: TSource[]
  }) => Promise<number[]>
  /** The resource in the messages: `Task flow 7: access denied`, `Failed to clone task flows`. */
  label: { plural: string; singular: string }
  /** Reads one source in phase 1, with no transaction open. The access check already passed. */
  readSource: (args: ReadCloneSourceArgs) => Promise<ReadCloneSourceResult<TSource>>
  /**
   * False when `cloneSource` writes into an existing record instead of a new one. A pasted
   * Prozessgruppe lands in an existing Thema, which must not read as a clone (PIMS-83, PIMS-93).
   */
  stampsCloneSource?: boolean
}

export type CloneEndpointResult =
  | ReturnType<typeof formatValidationErrors>
  | { details?: string[]; error: string }
  | { message: string; results: GenericCloneStatisticsFinalized }

export interface CloneSourceArgs<TSource> {
  /** Every locale the clone carries, default first. */
  cloneLocales: TypedLocale[]
  /** The copies phase 1 made, keyed by source document id. */
  documentPreloader: DocumentPreloader
  req: PayloadRequest
  /** What `readSource` retained for this source. */
  source: TSource
  sourceId: number
  targetOrgId: number
  /** The statistics of this source. `startEntity` already ran, so every counter lands on it. */
  tracker: CloneStatisticsTracker
}

export interface ReadCloneSourceArgs {
  /** Every locale the clone carries, default first. */
  cloneLocales: TypedLocale[]
  /** The request locale. It labels the report. */
  locale: TypedLocale
  req: PayloadRequest
  sourceId: number
}

export interface ReadCloneSourceResult<TSource> {
  /** Every document id the source links, in every locale. A duplicate is fine. */
  documentIds: number[]
  /** The label of the source in the report. */
  name: string
  /** What phase 2 needs from the reads. A collection that reads again in phase 2 keeps nothing. */
  source: TSource
}

/**
 * Builds the batch clone endpoint of one collection.
 *
 * The handler parses and checks the request. `runClonePipeline` runs the two phases, the
 * transaction and the cleanup, and answers the body and the status.
 */
export const createCloneEndpoint = <TSource>(config: CloneEndpointConfig<TSource>): Endpoint => ({
  handler: async (req) => {
    requireAuthentication(req)
    const user = req.user

    let validatedBody: CloneEndpointBody

    try {
      const rawBody = req.json ? await req.json() : {}
      const bodyResult = batchCloneBodySchema.safeParse(rawBody)

      if (!bodyResult.success) {
        req.payload.logger.warn({
          errors: formatValidationErrors(bodyResult.error),
          msg: 'Invalid batch clone request body',
          rawBody,
        })
        return Response.json(formatValidationErrors(bodyResult.error), { status: 400 })
      }
      validatedBody = bodyResult.data
    } catch (error) {
      req.payload.logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        msg: 'Error parsing batch clone request body',
      })
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { ids, locale: requestedLocale, position, target, targetOrganisationId } = validatedBody

    // A repeated id would clone one source twice, and the link remap would then visit the same
    // nested records twice. The second visit degrades the links the first visit resolved.
    const sourceIds = Array.from(new Set(ids))

    // Narrow the request locale to a configured content locale before any write starts.
    const locale = toContentLocale(requestedLocale, req.payload.config)

    if (!locale) {
      req.payload.logger.warn({
        msg: 'Unsupported locale in batch clone request',
        requestedLocale,
      })
      return Response.json({ error: 'Unsupported locale' }, { status: 400 })
    }

    // The clone carries every configured locale the source really has, not the request locale
    // alone. The request locale still labels the report and drives the access check.
    const cloneLocales = getCloneLocales(req.payload.config)

    const { body, status } = await runClonePipeline(config, {
      activityPosition: position,
      cloneLocales,
      locale,
      req,
      sourceIds,
      target,
      targetOrganisationId,
      user,
    })

    return Response.json(body, { status })
  },
  method: 'post',
  path: '/clone',
})
