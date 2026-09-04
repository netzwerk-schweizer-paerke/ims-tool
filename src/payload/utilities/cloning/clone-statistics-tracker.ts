import { CollectionSlug, PayloadRequest } from 'payload'

import { calculatePercentComplete } from './calculate-percent-complete'
import { GenericCloneStatistics, MissingDocumentFileError, OtherErrors } from './types'

export class CloneStatisticsTracker {
  private static instances: Map<string, CloneStatisticsTracker> = new Map()
  private currentEntityId: null | number = null
  private documentCloneMaps: Map<number, Map<number, number>> = new Map()
  private entitiesStats: Map<number, GenericCloneStatistics> = new Map()

  private constructor() {
    this.reset()
  }

  static clearAllInstances(): void {
    this.instances.clear()
  }

  // Payload declares `transactionID` as optional, so every call site can pass undefined.
  // Reading `.toString()` off undefined already threw here, so keep the failure explicit.
  static getInstance(transactionId: PayloadRequest['transactionID']): CloneStatisticsTracker {
    if (transactionId === undefined) {
      throw new Error('CloneStatisticsTracker.getInstance requires a transaction id')
    }

    const id = transactionId.toString()
    if (!this.instances.has(id)) {
      this.instances.set(id, new CloneStatisticsTracker())
    }
    return this.instances.get(id) as CloneStatisticsTracker
  }

  addClonedBlock(): void {
    const stats = this.getCurrentStats()
    stats.cloned.blocksCount++
  }

  addClonedDocument(): void {
    const stats = this.getCurrentStats()
    stats.cloned.documentFilesCount++
  }

  addClonedFile(): void {
    const stats = this.getCurrentStats()
    stats.cloned.filesCount++
  }

  addClonedItem(): void {
    const stats = this.getCurrentStats()
    stats.cloned.itemsCount++
  }

  addClonedPublicDocument(): void {
    const stats = this.getCurrentStats()
    stats.cloned.publicDocumentFilesCount++
  }

  addClonedRelatedItem(): void {
    const stats = this.getCurrentStats()
    stats.cloned.relatedEntitiesCount++
  }

  addError(error: OtherErrors): void {
    const stats = this.getCurrentStats()
    stats.errors.otherErrors.push(error)
  }

  addMissingFileError(error: GenericCloneStatistics['errors']['missingDocumentFiles'][0]): void {
    const stats = this.getCurrentStats()
    stats.errors.missingDocumentFiles.push(error)
  }

  addSourceBlock(): void {
    const stats = this.getCurrentStats()
    stats.source.blocksCount++
  }

  addSourceDocument(): void {
    const stats = this.getCurrentStats()
    stats.source.documentFilesCount++
  }

  addSourceFile(): void {
    const stats = this.getCurrentStats()
    stats.source.filesCount++
  }

  addSourceItem(): void {
    const stats = this.getCurrentStats()
    stats.source.itemsCount++
  }

  addSourcePublicDocument(): void {
    const stats = this.getCurrentStats()
    stats.source.publicDocumentFilesCount++
  }

  addSourceRelatedItem(): void {
    const stats = this.getCurrentStats()
    stats.source.relatedEntitiesCount++
  }

  calculateCompleteness(entityId?: number): void {
    const targetEntityId = entityId ?? this.currentEntityId
    if (targetEntityId === null) return

    const stats = this.entitiesStats.get(targetEntityId)
    if (!stats) return

    // Calculate completeness based on document files
    const totalSourceFiles = stats.source.documentFilesCount + stats.source.publicDocumentFilesCount
    const totalClonedFiles = stats.cloned.documentFilesCount + stats.cloned.publicDocumentFilesCount

    stats.percentComplete = calculatePercentComplete(totalSourceFiles, totalClonedFiles)
  }

  determineSuccessLevel(): 'fail' | 'partial' | 'success' {
    // Ensure all entities have their completeness calculated
    for (const entityId of Array.from(this.entitiesStats.keys())) {
      this.calculateCompleteness(entityId)
    }

    const entities = Array.from(this.entitiesStats.values())

    if (entities.length === 0) {
      return 'fail'
    }

    // Check if entities were successfully cloned (have valid cloned IDs)
    const successfullyClonedEntities = entities.filter(
      (entity) => entity.cloned.id && entity.cloned.id !== 0 && entity.cloned.id !== '0',
    )

    const failedEntities = entities.filter(
      (entity) => !entity.cloned.id || entity.cloned.id === 0 || entity.cloned.id === '0',
    )

    // If no entities were cloned successfully, it's a complete failure
    if (successfullyClonedEntities.length === 0) {
      return 'fail'
    }

    // Check if there are any errors (missing files, system errors) across successfully cloned entities
    const hasErrors = successfullyClonedEntities.some(
      (entity) =>
        entity.errors.missingDocumentFiles.length > 0 || entity.errors.otherErrors.length > 0,
    )

    // If all entities were cloned successfully
    if (failedEntities.length === 0) {
      // No failures, check for errors in successful clones
      return hasErrors ? 'partial' : 'success'
    }
    // Some entities failed to clone entirely, so at best it's partial success
    return 'partial'
  }

  endEntity(): void {
    if (this.currentEntityId === null) {
    	return;
    }

    this.calculateCompleteness(this.currentEntityId)
    this.currentEntityId = null
  }

  finalize(): {
    aggregated: GenericCloneStatistics
    entities: GenericCloneStatistics[]
    successLevel: 'fail' | 'partial' | 'success'
  } {
    // Ensure all entities have their completeness calculated
    for (const entityId of Array.from(this.entitiesStats.keys())) {
      this.calculateCompleteness(entityId)
    }

    const entities = Array.from(this.entitiesStats.values())

    // Calculate aggregated statistics
    const aggregated: GenericCloneStatistics = {
      cloned: {
        blocksCount: 0,
        collection: null,
        documentFilesCount: 0,
        filesCount: 0,
        id: 'aggregated',
        itemsCount: 0,
        name: 'Aggregated Statistics',
        publicDocumentFilesCount: 0,
        relatedEntitiesCount: 0,
      },
      errors: {
        missingDocumentFiles: [],
        otherErrors: [],
      },
      percentComplete: 0,
      source: {
        blocksCount: 0,
        collection: null,
        documentFilesCount: 0,
        filesCount: 0,
        id: 'aggregated',
        itemsCount: 0,
        name: 'Aggregated Statistics',
        publicDocumentFilesCount: 0,
        relatedEntitiesCount: 0,
      },
    }

    // Aggregate all entity statistics
    for (const entityStats of entities) {
      aggregated.source.relatedEntitiesCount += entityStats.source.relatedEntitiesCount
      aggregated.source.documentFilesCount += entityStats.source.documentFilesCount
      aggregated.source.publicDocumentFilesCount += entityStats.source.publicDocumentFilesCount
      aggregated.source.blocksCount += entityStats.source.blocksCount
      aggregated.source.itemsCount += entityStats.source.itemsCount
      aggregated.source.filesCount += entityStats.source.filesCount

      aggregated.cloned.relatedEntitiesCount += entityStats.cloned.relatedEntitiesCount
      aggregated.cloned.documentFilesCount += entityStats.cloned.documentFilesCount
      aggregated.cloned.publicDocumentFilesCount += entityStats.cloned.publicDocumentFilesCount
      aggregated.cloned.blocksCount += entityStats.cloned.blocksCount
      aggregated.cloned.itemsCount += entityStats.cloned.itemsCount
      aggregated.cloned.filesCount += entityStats.cloned.filesCount

      aggregated.errors.missingDocumentFiles.push(...entityStats.errors.missingDocumentFiles)
      aggregated.errors.otherErrors.push(...entityStats.errors.otherErrors)
    }

    // Calculate aggregated completeness
    const totalSourceFiles =
      aggregated.source.documentFilesCount + aggregated.source.publicDocumentFilesCount
    const totalClonedFiles =
      aggregated.cloned.documentFilesCount + aggregated.cloned.publicDocumentFilesCount

    aggregated.percentComplete = calculatePercentComplete(totalSourceFiles, totalClonedFiles)

    // Determine success level using the new method
    const successLevel = this.determineSuccessLevel()

    return {
      aggregated,
      entities,
      successLevel,
    }
  }

  getClonedDocumentId(sourceId: number): number | undefined {
    return this.getCurrentDocumentCloneMap().get(sourceId)
  }

  getStatistics(entityId?: number): GenericCloneStatistics {
    const targetEntityId = entityId ?? this.currentEntityId
    if (targetEntityId === null) {
      throw new Error('No entity specified and no current entity set.')
    }

    this.calculateCompleteness(targetEntityId)
    const stats = this.entitiesStats.get(targetEntityId)
    if (!stats) {
      throw new Error(`No statistics found for entity ${targetEntityId}`)
    }
    return stats
  }

  processRichTextResults(
    result: {
      documentIds: number[]
      // A caller carries an extra `location` that MissingDocumentFileError does not declare.
      errors: (MissingDocumentFileError & { location?: string })[]
      publicDocumentIds: number[]
    },
    location?: string,
  ): void {
    if (result.documentIds) {
      for (const _documentId of result.documentIds) {
        this.addSourceDocument()
      }
    }
    if (result.publicDocumentIds) {
      for (const _publicDocumentId of result.publicDocumentIds) {
        this.addClonedPublicDocument()
      }
    }
    if (result.errors) {
      for (const error of result.errors) {
        // A named local carries the extra key through. An object literal would trip the
        // excess property check on `addMissingFileError`.
        const entry: MissingDocumentFileError & { location?: string } = {
          ...error,
          location: error.location || location,
        }
        this.addMissingFileError(entry)
      }
    }
  }

  reset(): void {
    this.entitiesStats = new Map()
    this.documentCloneMaps = new Map()
    this.currentEntityId = null
  }

  setCloneInfo(id: number, name: string, collection: CollectionSlug): void {
    const stats = this.getCurrentStats()
    stats.cloned = {
      ...stats.cloned,
      collection,
      id,
      name,
    }
  }

  setDocumentCloneMapping(sourceId: number, clonedId: number): void {
    this.getCurrentDocumentCloneMap().set(sourceId, clonedId)
  }

  setSourceInfo(id: number, name: string, collection: CollectionSlug): void {
    const stats = this.getCurrentStats()
    stats.source = {
      ...stats.source,
      collection,
      id,
      name,
    }
  }

  startEntity(entityId: number): void {
    this.currentEntityId = entityId
    if (!this.entitiesStats.has(entityId)) {
      this.entitiesStats.set(entityId, {
        cloned: {
          blocksCount: 0,
          collection: null,
          documentFilesCount: 0,
          filesCount: 0,
          id: 0,
          itemsCount: 0,
          name: '',
          publicDocumentFilesCount: 0,
          relatedEntitiesCount: 0,
        },
        errors: {
          missingDocumentFiles: [],
          otherErrors: [],
        },
        percentComplete: 0,
        source: {
          blocksCount: 0,
          collection: null,
          documentFilesCount: 0,
          filesCount: 0,
          id: 0,
          itemsCount: 0,
          name: '',
          publicDocumentFilesCount: 0,
          relatedEntitiesCount: 0,
        },
      })
      this.documentCloneMaps.set(entityId, new Map())
    }
  }

  private getCurrentDocumentCloneMap(): Map<number, number> {
    if (this.currentEntityId === null) {
      throw new Error('No current entity set. Call startEntity() first.')
    }
    return this.documentCloneMaps.get(this.currentEntityId)!
  }

  private getCurrentStats(): GenericCloneStatistics {
    if (this.currentEntityId === null) {
      throw new Error('No current entity set. Call startEntity() first.')
    }
    return this.entitiesStats.get(this.currentEntityId)!
  }
}
