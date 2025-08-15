import { PayloadRequest } from 'payload'
import { validateCloneAccess } from './validate-access'
import { CloneStatisticsTracker } from './clone-statistics-tracker'
import { getErrorMessage, withErrorHandling } from './error-utils'
import { CloneResponse } from './types'

export interface CloneConfig<TSource = any, TCloned = any> {
  collectionSlug: 'activities' | 'task-flows' | 'task-lists'
  sourceId: number | string
  targetOrgId: number
  req: PayloadRequest
  stripDocument: (doc: TSource, targetOrgId: number) => Promise<Partial<TCloned>>
  processRelationships?: (doc: TSource, clonedDoc: TCloned, req: PayloadRequest) => Promise<void>
}

export class GenericCloneExecutor<TSource = any, TCloned = any> {
  private tracker: CloneStatisticsTracker

  constructor(private config: CloneConfig<TSource, TCloned>) {
    this.tracker = CloneStatisticsTracker.getInstance(config.req.transactionID)
  }

  async execute(): Promise<CloneResponse> {
    const { req, sourceId, targetOrgId, collectionSlug } = this.config

    this.tracker.reset()

    try {
      const user = req.user
      const accessResult = await validateCloneAccess({
        req,
        user,
        sourceId,
        targetOrgId,
        collectionSlug,
      })

      if (!accessResult.isValid) {
        throw new Error(accessResult.error?.message || 'Access denied')
      }

      const sourceDoc = await withErrorHandling(
        () =>
          req.payload.findByID({
            req,
            collection: collectionSlug,
            id: sourceId,
            depth: 1, // Depth 1 to populate organisation but not nested richtext relationships
            locale: req.locale,
          }),
        `Failed to fetch source ${collectionSlug}`,
        req.payload.logger,
        { sourceId, collectionSlug },
      )

      if (!sourceDoc) {
        throw new Error(`Source ${collectionSlug} not found`)
      }

      const strippedData = await withErrorHandling(
        () => this.config.stripDocument(sourceDoc as TSource, targetOrgId),
        'Failed to prepare document for cloning',
        req.payload.logger,
        { sourceId },
      )

      const clonedDoc = await withErrorHandling(
        () =>
          req.payload.create({
            req,
            collection: collectionSlug,
            data: {
              ...strippedData,
              organisation: targetOrgId,
              createdBy: user?.id,
              updatedBy: user?.id,
            } as any,
            locale: req.locale === 'all' ? undefined : req.locale,
            depth: 0,
          }),
        `Failed to create cloned ${collectionSlug}`,
        req.payload.logger,
        { sourceId, targetOrgId },
      )

      if (this.config.processRelationships) {
        await withErrorHandling(
          () => this.config.processRelationships!(sourceDoc as TSource, clonedDoc as TCloned, req),
          'Failed to process relationships',
          req.payload.logger,
          { sourceId: sourceDoc.id, clonedId: clonedDoc.id },
        )
      }

      const statistics = this.tracker.getStatistics()

      req.payload.logger.info({
        msg: `Successfully cloned ${collectionSlug}`,
        sourceId: sourceDoc.id,
        clonedId: clonedDoc.id,
        targetOrgId,
        statistics,
      })

      return {
        message: `Successfully cloned ${collectionSlug}`,
        documentId: clonedDoc.id,
        statistics,
      }
    } catch (error) {
      req.payload.logger.error({
        msg: `Failed to clone ${collectionSlug}`,
        error: getErrorMessage(error),
        sourceId,
        targetOrgId,
      })

      throw error
    }
  }
}
