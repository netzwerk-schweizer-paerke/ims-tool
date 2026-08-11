import { PayloadRequest } from 'payload'

import { CloneStatisticsTracker } from './clone-statistics-tracker'
import { getErrorMessage, withErrorHandling } from './error-utils'
import { CloneResponse } from './types'
import { validateCloneAccess } from './validate-access'

export interface CloneConfig<TSource = any, TCloned = any> {
  collectionSlug: 'activities' | 'task-flows' | 'task-lists'
  processRelationships?: (doc: TSource, clonedDoc: TCloned, req: PayloadRequest) => Promise<void>
  req: PayloadRequest
  sourceId: number | string
  stripDocument: (doc: TSource, targetOrgId: number) => Promise<Partial<TCloned>>
  targetOrgId: number
}

export class GenericCloneExecutor<TSource = any, TCloned = any> {
  private tracker: CloneStatisticsTracker

  constructor(private config: CloneConfig<TSource, TCloned>) {
    this.tracker = CloneStatisticsTracker.getInstance(config.req.transactionID)
  }

  async execute(): Promise<CloneResponse> {
    const { collectionSlug, req, sourceId, targetOrgId } = this.config

    this.tracker.reset()

    try {
      const user = req.user
      const accessResult = await validateCloneAccess({
        collectionSlug,
        req,
        sourceId,
        targetOrgId,
        user,
      })

      if (!accessResult.isValid) {
        throw new Error(accessResult.error?.message || 'Access denied')
      }

      const sourceDoc = await withErrorHandling(
        () =>
          req.payload.findByID({
            collection: collectionSlug,
            depth: 1, // Depth 1 to populate organisation but not nested richtext relationships
            id: sourceId,
            locale: req.locale,
            req,
          }),
        `Failed to fetch source ${collectionSlug}`,
        req.payload.logger,
        { collectionSlug, sourceId },
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
            collection: collectionSlug,
            data: {
              ...strippedData,
              createdBy: user?.id,
              organisation: targetOrgId,
              updatedBy: user?.id,
            } as any,
            depth: 0,
            locale: req.locale === 'all' ? undefined : req.locale,
            req,
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
          { clonedId: clonedDoc.id, sourceId: sourceDoc.id },
        )
      }

      const statistics = this.tracker.getStatistics()

      req.payload.logger.info({
        clonedId: clonedDoc.id,
        msg: `Successfully cloned ${collectionSlug}`,
        sourceId: sourceDoc.id,
        statistics,
        targetOrgId,
      })

      return {
        documentId: clonedDoc.id,
        message: `Successfully cloned ${collectionSlug}`,
        statistics,
      }
    } catch (error) {
      req.payload.logger.error({
        error: getErrorMessage(error),
        msg: `Failed to clone ${collectionSlug}`,
        sourceId,
        targetOrgId,
      })

      throw error
    }
  }
}
