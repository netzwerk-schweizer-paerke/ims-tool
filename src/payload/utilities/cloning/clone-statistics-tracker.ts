import { CollectionSlug, PayloadRequest } from 'payload'

import { calculatePercentComplete } from './calculate-percent-complete'
import { GenericCloneStatistics, OtherErrors } from './types'

export class CloneStatisticsTracker {
  private static instances: Map<string, CloneStatisticsTracker> = new Map()
  private currentEntityId: null | number = null
  private documentCloneMaps: Map<number, Map<number, number>> = new Map()
  private documentClonePromises: Map<number, Map<number, Promise<number>>> = new Map()
  private entitiesStats: Map<number, GenericCloneStatistics> = new Map()
  private taskClonePromises: Map<number, Map<string, Promise<number>>> = new Map()

  /**
   * The endpoint keys one instance per transaction through `getInstance`. Every helper below it
   * receives that instance as a parameter, so a test constructs one directly and primes no map.
   */
  constructor() {
    this.reset()
  }

  /**
   * Drops the tracker of one finished transaction.
   *
   * An instance holds the statistics, the clone map and the promise map of every entity in the
   * request. Without this call the static map keeps all of them for the life of the process.
   */
  static disposeInstance(transactionId: PayloadRequest['transactionID']): void {
    if (transactionId === undefined) {
      return
    }

    this.instances.delete(transactionId.toString())
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

  /**
   * One row per source document, never one per link to it. Several fields await the same
   * clone attempt, so each of them reports the same failure.
   */
  addMissingFileError(error: GenericCloneStatistics['errors']['missingDocumentFiles'][0]): void {
    const stats = this.getCurrentStats()

    if (stats.errors.missingDocumentFiles.some((entry) => entry.documentId === error.documentId)) {
      return
    }

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

  reset(): void {
    this.entitiesStats = new Map()
    this.documentCloneMaps = new Map()
    this.documentClonePromises = new Map()
    this.taskClonePromises = new Map()
    this.currentEntityId = null
  }

  /**
   * Copies a source document once per entity, however many fields link it.
   *
   * The strip helpers walk blocks and items with `Promise.all`, so every caller reads the
   * map before any caller writes it. Memoise the in-flight promise, never the finished id.
   */
  async resolveClonedDocumentId(
    sourceId: number,
    cloneDocument: () => Promise<number>,
  ): Promise<number> {
    const inFlight = this.getCurrentDocumentClonePromises()
    const existing = inFlight.get(sourceId)

    if (existing) {
      return existing
    }

    this.addSourceDocument()

    // A rejection stays in the map on purpose. One failed download is one failure for the
    // whole entity, and a retry per link would repeat a 30-second timeout for each one.
    const promise = cloneDocument().then((clonedId) => {
      this.setDocumentCloneMapping(sourceId, clonedId)
      this.addClonedDocument()
      return clonedId
    })

    inFlight.set(sourceId, promise)

    return promise
  }

  /**
   * Copies a nested task once per entity, however many locales name it.
   *
   * Two locales of one activity often reference the same task flow. Both must point at one
   * clone, and the report must count that task once.
   */
  async resolveClonedTaskId(
    collection: 'task-flows' | 'task-lists',
    sourceId: number,
    cloneTask: () => Promise<number>,
  ): Promise<number> {
    const inFlight = this.getCurrentTaskClonePromises()
    const key = `${collection}:${sourceId}`
    const existing = inFlight.get(key)

    if (existing) {
      return existing
    }

    this.addSourceRelatedItem()

    const promise = cloneTask().then((clonedId) => {
      this.addClonedRelatedItem()
      return clonedId
    })

    inFlight.set(key, promise)

    return promise
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

  /**
   * Makes one entity current. A second call for the same entity keeps the maps it already has.
   *
   * The locale passes of one clone call this once per locale. They must share the document
   * maps, so that a document three locales link is copied once and counted once.
   */
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
      this.documentClonePromises.set(entityId, new Map())
      this.taskClonePromises.set(entityId, new Map())
    }
  }

  private getCurrentDocumentCloneMap(): Map<number, number> {
    if (this.currentEntityId === null) {
      throw new Error('No current entity set. Call startEntity() first.')
    }
    return this.documentCloneMaps.get(this.currentEntityId)!
  }

  private getCurrentDocumentClonePromises(): Map<number, Promise<number>> {
    if (this.currentEntityId === null) {
      throw new Error('No current entity set. Call startEntity() first.')
    }
    return this.documentClonePromises.get(this.currentEntityId)!
  }

  private getCurrentStats(): GenericCloneStatistics {
    if (this.currentEntityId === null) {
      throw new Error('No current entity set. Call startEntity() first.')
    }
    return this.entitiesStats.get(this.currentEntityId)!
  }

  private getCurrentTaskClonePromises(): Map<string, Promise<number>> {
    if (this.currentEntityId === null) {
      throw new Error('No current entity set. Call startEntity() first.')
    }
    return this.taskClonePromises.get(this.currentEntityId)!
  }
}
