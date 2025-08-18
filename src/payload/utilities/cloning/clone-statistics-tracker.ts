import { GenericCloneStatistics, MissingDocumentFileError, OtherErrors } from './types'
import { CollectionSlug } from 'payload'

export class CloneStatisticsTracker {
  private static instances: Map<string, CloneStatisticsTracker> = new Map()
  private entitiesStats: Map<number, GenericCloneStatistics> = new Map()
  private documentCloneMaps: Map<number, Map<number, number>> = new Map()
  private currentEntityId: number | null = null

  private constructor(id: string) {
    this.reset()
  }

  static getInstance(transactionId: any): CloneStatisticsTracker {
    const id = transactionId.toString()
    if (!CloneStatisticsTracker.instances.has(id)) {
      CloneStatisticsTracker.instances.set(id, new CloneStatisticsTracker(id))
    }
    return CloneStatisticsTracker.instances.get(id) as CloneStatisticsTracker
  }

  reset(): void {
    this.entitiesStats = new Map()
    this.documentCloneMaps = new Map()
    this.currentEntityId = null
  }

  startEntity(entityId: number): void {
    this.currentEntityId = entityId
    if (!this.entitiesStats.has(entityId)) {
      this.entitiesStats.set(entityId, {
        source: {
          id: 0,
          name: '',
          collection: null,
          relatedEntitiesCount: 0,
          documentFilesCount: 0,
          publicDocumentFilesCount: 0,
          blocksCount: 0,
          itemsCount: 0,
          filesCount: 0,
        },
        cloned: {
          id: 0,
          name: '',
          collection: null,
          relatedEntitiesCount: 0,
          documentFilesCount: 0,
          publicDocumentFilesCount: 0,
          blocksCount: 0,
          itemsCount: 0,
          filesCount: 0,
        },
        percentComplete: 0,
        errors: {
          missingDocumentFiles: [],
          otherErrors: [],
        },
      })
      this.documentCloneMaps.set(entityId, new Map())
    }
  }

  endEntity(): void {
    if (this.currentEntityId !== null) {
      this.calculateCompleteness(this.currentEntityId)
      this.currentEntityId = null
    }
  }

  private getCurrentStats(): GenericCloneStatistics {
    if (this.currentEntityId === null) {
      throw new Error('No current entity set. Call startEntity() first.')
    }
    return this.entitiesStats.get(this.currentEntityId)!
  }

  private getCurrentDocumentCloneMap(): Map<number, number> {
    if (this.currentEntityId === null) {
      throw new Error('No current entity set. Call startEntity() first.')
    }
    return this.documentCloneMaps.get(this.currentEntityId)!
  }

  setSourceInfo(id: number, name: string, collection: CollectionSlug): void {
    const stats = this.getCurrentStats()
    stats.source = {
      ...stats.source,
      name,
      id,
      collection,
    }
  }

  setCloneInfo(id: number, name: string, collection: CollectionSlug): void {
    const stats = this.getCurrentStats()
    stats.cloned = {
      ...stats.cloned,
      name,
      id,
      collection,
    }
  }

  addSourceDocument(): void {
    const stats = this.getCurrentStats()
    stats.source.documentFilesCount++
  }

  addClonedDocument(): void {
    const stats = this.getCurrentStats()
    stats.cloned.documentFilesCount++
  }

  addSourceBlock(): void {
    const stats = this.getCurrentStats()
    stats.source.blocksCount++
  }

  addClonedBlock(): void {
    const stats = this.getCurrentStats()
    stats.cloned.blocksCount++
  }

  addSourcePublicDocument(): void {
    const stats = this.getCurrentStats()
    stats.source.publicDocumentFilesCount++
  }

  addClonedPublicDocument(): void {
    const stats = this.getCurrentStats()
    stats.cloned.publicDocumentFilesCount++
  }

  getClonedDocumentId(sourceId: number): number | undefined {
    return this.getCurrentDocumentCloneMap().get(sourceId)
  }

  addSourceRelatedItem(): void {
    const stats = this.getCurrentStats()
    stats.source.relatedEntitiesCount++
  }

  addClonedRelatedItem(): void {
    const stats = this.getCurrentStats()
    stats.cloned.relatedEntitiesCount++
  }

  addSourceItem(): void {
    const stats = this.getCurrentStats()
    stats.source.itemsCount++
  }

  addClonedItem(): void {
    const stats = this.getCurrentStats()
    stats.cloned.itemsCount++
  }

  addSourceFile(): void {
    const stats = this.getCurrentStats()
    stats.source.filesCount++
  }

  addClonedFile(): void {
    const stats = this.getCurrentStats()
    stats.cloned.filesCount++
  }

  addMissingFileError(error: GenericCloneStatistics['errors']['missingDocumentFiles'][0]): void {
    const stats = this.getCurrentStats()
    stats.errors.missingDocumentFiles.push(error)
  }

  calculateCompleteness(entityId?: number): void {
    const targetEntityId = entityId ?? this.currentEntityId
    if (targetEntityId === null) return

    const stats = this.entitiesStats.get(targetEntityId)
    if (!stats) return

    // Calculate completeness based on document files
    const totalSourceFiles = stats.source.documentFilesCount + stats.source.publicDocumentFilesCount
    const totalClonedFiles = stats.cloned.documentFilesCount + stats.cloned.publicDocumentFilesCount
    const errorCount = stats.errors.missingDocumentFiles.length

    if (totalSourceFiles === 0) {
      stats.percentComplete = 100
    } else {
      const successfulFiles = totalClonedFiles - errorCount
      stats.percentComplete = Math.round((successfulFiles / totalSourceFiles) * 100)
    }
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

  static clearAllInstances(): void {
    CloneStatisticsTracker.instances.clear()
  }

  processRichTextResults(
    result: {
      documentIds: number[]
      publicDocumentIds: number[]
      errors: MissingDocumentFileError[]
    },
    location?: string,
  ): void {
    if (result.documentIds) {
      result.documentIds.forEach(() => this.addSourceDocument())
    }
    if (result.publicDocumentIds) {
      result.publicDocumentIds.forEach(() => this.addClonedPublicDocument())
    }
    if (result.errors) {
      result.errors.forEach((error: any) => {
        this.addMissingFileError({
          ...error,
          location: error.location || location,
        })
      })
    }
  }

  setDocumentCloneMapping(sourceId: number, clonedId: number): void {
    this.getCurrentDocumentCloneMap().set(sourceId, clonedId)
  }

  addError(error: OtherErrors): void {
    const stats = this.getCurrentStats()
    stats.errors.otherErrors.push(error)
  }

  determineSuccessLevel(): 'success' | 'partial' | 'fail' {
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
    } else {
      // Some entities failed to clone entirely, so at best it's partial success
      return 'partial'
    }
  }

  finalize(): {
    entities: GenericCloneStatistics[]
    aggregated: GenericCloneStatistics
    successLevel: 'success' | 'partial' | 'fail'
  } {
    // Ensure all entities have their completeness calculated
    for (const entityId of Array.from(this.entitiesStats.keys())) {
      this.calculateCompleteness(entityId)
    }

    const entities = Array.from(this.entitiesStats.values())

    // Calculate aggregated statistics
    const aggregated: GenericCloneStatistics = {
      source: {
        id: 'aggregated',
        name: 'Aggregated Statistics',
        collection: null,
        relatedEntitiesCount: 0,
        documentFilesCount: 0,
        publicDocumentFilesCount: 0,
        blocksCount: 0,
        itemsCount: 0,
        filesCount: 0,
      },
      cloned: {
        id: 'aggregated',
        name: 'Aggregated Statistics',
        collection: null,
        relatedEntitiesCount: 0,
        documentFilesCount: 0,
        publicDocumentFilesCount: 0,
        blocksCount: 0,
        itemsCount: 0,
        filesCount: 0,
      },
      percentComplete: 0,
      errors: {
        missingDocumentFiles: [],
        otherErrors: [],
      },
    }

    // Aggregate all entity statistics
    entities.forEach((entityStats) => {
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
    })

    // Calculate aggregated completeness
    const totalSourceFiles =
      aggregated.source.documentFilesCount + aggregated.source.publicDocumentFilesCount
    const totalClonedFiles =
      aggregated.cloned.documentFilesCount + aggregated.cloned.publicDocumentFilesCount
    const totalErrors = aggregated.errors.missingDocumentFiles.length

    if (totalSourceFiles === 0) {
      aggregated.percentComplete = 100
    } else {
      const successfulFiles = totalClonedFiles - totalErrors
      aggregated.percentComplete = Math.round((successfulFiles / totalSourceFiles) * 100)
    }

    // Determine success level using the new method
    const successLevel = this.determineSuccessLevel()

    return {
      entities,
      aggregated,
      successLevel,
    }
  }
}
