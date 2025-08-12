import { CloneStatistics } from '@/payload/collections/Activities/types/clone-statistics'
import { RichTextProcessingResult } from './strip-richtext'

/**
 * Singleton class to track statistics during the activity cloning process.
 * This eliminates the need to pass statistics through the entire function chain.
 */
export class CloneStatisticsTracker {
  private static instance: CloneStatisticsTracker | null = null
  private statistics!: CloneStatistics
  private sourceDocumentIds!: Set<number>
  private clonedDocumentIds!: Set<number>
  private sourceDocumentUsageCount!: number // Total usages including duplicates
  private clonedDocumentUsageCount!: number // Total cloned usages including duplicates
  private sourcePublicDocumentUsageCount!: number // Public document usages
  private clonedPublicDocumentUsageCount!: number // Cloned public document usages
  private documentCloneMap!: Map<number, number> // Maps source doc ID to cloned doc ID

  private constructor() {
    this.reset()
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): CloneStatisticsTracker {
    if (!CloneStatisticsTracker.instance) {
      CloneStatisticsTracker.instance = new CloneStatisticsTracker()
    }
    return CloneStatisticsTracker.instance
  }

  /**
   * Reset the tracker for a new cloning operation
   */
  reset(): void {
    this.sourceDocumentIds = new Set<number>()
    this.clonedDocumentIds = new Set<number>()
    this.sourceDocumentUsageCount = 0
    this.clonedDocumentUsageCount = 0
    this.sourcePublicDocumentUsageCount = 0
    this.clonedPublicDocumentUsageCount = 0
    this.documentCloneMap = new Map<number, number>()
    this.statistics = {
      source: {
        id: 0,
        name: '',
        hasDescription: false,
        variant: '',
        blocksCount: 0,
        filesCount: 0,
        blockTypes: [],
        totalTasks: 0,
        fieldsPopulated: [],
      },
      cloned: {
        id: 0,
        name: '',
        hasDescription: false,
        variant: '',
        blocksCount: 0,
        filesCount: 0,
        blockTypes: [],
        totalTasks: 0,
        documentsCloned: 0,
        taskFlowsCloned: 0,
        taskListsCloned: 0,
      },
      completeness: {
        percentComplete: 0,
        fieldsPreserved: [],
        fieldsModified: [],
        fieldsRemoved: [],
      },
      errors: {
        missingFiles: [],
        failedTasks: [],
      },
    }
  }

  /**
   * Set source activity statistics
   */
  setSourceStats(stats: Partial<CloneStatistics['source']>): void {
    Object.assign(this.statistics.source, stats)
  }

  /**
   * Set cloned activity statistics
   */
  setClonedStats(stats: Partial<CloneStatistics['cloned']>): void {
    Object.assign(this.statistics.cloned, stats)
  }

  /**
   * Track a document found in the source
   */
  addSourceDocument(documentId: number): void {
    this.sourceDocumentIds.add(documentId)
    this.sourceDocumentUsageCount++ // Count every usage, including duplicates
  }

  /**
   * Track multiple documents found in the source
   */
  addSourceDocuments(documentIds: number[]): void {
    documentIds.forEach((id) => {
      this.sourceDocumentIds.add(id)
      this.sourceDocumentUsageCount++ // Count every usage, including duplicates
    })
  }

  /**
   * Track a successfully cloned document
   */
  addClonedDocument(documentId: number): void {
    this.clonedDocumentIds.add(documentId)
    this.clonedDocumentUsageCount++ // Count every usage, including duplicates
  }

  /**
   * Track multiple successfully cloned documents
   */
  addClonedDocuments(documentIds: number[]): void {
    documentIds.forEach((id) => {
      this.clonedDocumentIds.add(id)
      this.clonedDocumentUsageCount++ // Count every usage, including duplicates
    })
  }

  /**
   * Track a public document found in the source
   */
  addSourcePublicDocument(): void {
    this.sourcePublicDocumentUsageCount++
  }

  /**
   * Track a public document preserved in the clone
   */
  addClonedPublicDocument(): void {
    this.clonedPublicDocumentUsageCount++
  }

  /**
   * Check if a document has already been cloned
   */
  hasClonedDocument(sourceDocumentId: number): boolean {
    return this.documentCloneMap.has(sourceDocumentId)
  }

  /**
   * Get the cloned document ID for a source document
   */
  getClonedDocumentId(sourceDocumentId: number): number | undefined {
    return this.documentCloneMap.get(sourceDocumentId)
  }

  /**
   * Store the mapping between source and cloned document
   */
  setDocumentCloneMapping(sourceDocumentId: number, clonedDocumentId: number): void {
    this.documentCloneMap.set(sourceDocumentId, clonedDocumentId)
    // Also track in the cloned document set
    this.clonedDocumentIds.add(sourceDocumentId)
  }

  /**
   * Add a missing file error
   */
  addMissingFileError(error: CloneStatistics['errors']['missingFiles'][0]): void {
    this.statistics.errors.missingFiles.push(error)
  }

  /**
   * Add multiple missing file errors
   */
  addMissingFileErrors(errors: CloneStatistics['errors']['missingFiles']): void {
    this.statistics.errors.missingFiles.push(...errors)
  }

  /**
   * Process rich text processing results
   */
  processRichTextResults(results: RichTextProcessingResult, locationPrefix?: string): void {
    // Track documents
    if (results.documentsFound) {
      this.addSourceDocuments(results.documentsFound)
    }
    if (results.documentsCloned) {
      this.addClonedDocuments(results.documentsCloned)
    }

    // Track errors
    if (results.errors && results.errors.length > 0) {
      const errors = results.errors.map((error) => ({
        ...error,
        usageLocation: locationPrefix ? `${locationPrefix} - ${error.location}` : error.location,
      }))
      this.addMissingFileErrors(errors)
    }
  }

  /**
   * Increment task flow cloned count
   */
  incrementTaskFlowsCloned(): void {
    this.statistics.cloned.taskFlowsCloned++
  }

  /**
   * Increment task list cloned count
   */
  incrementTaskListsCloned(): void {
    this.statistics.cloned.taskListsCloned++
  }

  /**
   * Set task flow blocks cloned count
   */
  setTaskFlowBlocksCloned(count: number): void {
    this.statistics.cloned.taskFlowBlocksCloned = count
  }

  /**
   * Set task list blocks cloned count
   */
  setTaskListBlocksCloned(count: number): void {
    this.statistics.cloned.taskListBlocksCloned = count
  }

  /**
   * Calculate completeness and finalize statistics
   */
  finalize(): CloneStatistics {
    // Update document counts - use usage counts (including duplicates)
    this.statistics.source.totalDocumentsFound = this.sourceDocumentUsageCount
    this.statistics.cloned.totalDocumentsCloned = this.clonedDocumentUsageCount

    // Also track unique document counts for reference
    this.statistics.source.uniqueDocumentsFound = this.sourceDocumentIds.size
    this.statistics.cloned.uniqueDocumentsCloned = this.clonedDocumentIds.size

    // Track public document counts
    this.statistics.source.publicDocumentsFound = this.sourcePublicDocumentUsageCount
    this.statistics.cloned.publicDocumentsPreserved = this.clonedPublicDocumentUsageCount

    // Calculate documents from rich text vs direct attachments (using usage counts)
    const directAttachmentCount = this.statistics.source.filesCount
    this.statistics.source.richTextDocumentsFound = Math.max(
      0,
      this.sourceDocumentUsageCount - directAttachmentCount,
    )
    this.statistics.cloned.richTextDocumentsCloned = Math.max(
      0,
      this.clonedDocumentUsageCount - this.statistics.cloned.documentsCloned,
    )

    // Calculate completeness
    const fieldsPreserved = []
    const fieldsModified = []
    const fieldsRemoved = []

    // Check field preservation
    if (this.statistics.source.name === this.statistics.cloned.name) {
      fieldsPreserved.push('name')
    } else {
      fieldsModified.push('name')
    }

    if (this.statistics.source.hasDescription === this.statistics.cloned.hasDescription) {
      fieldsPreserved.push('description')
    } else if (!this.statistics.cloned.hasDescription && this.statistics.source.hasDescription) {
      fieldsRemoved.push('description')
    }

    if (this.statistics.source.variant === this.statistics.cloned.variant) {
      fieldsPreserved.push('variant')
    } else {
      fieldsModified.push('variant')
    }

    if (this.statistics.source.blocksCount === this.statistics.cloned.blocksCount) {
      fieldsPreserved.push('blocksCount')
    } else {
      fieldsModified.push('blocksCount')
    }

    if (this.statistics.source.filesCount === this.statistics.cloned.filesCount) {
      fieldsPreserved.push('filesCount')
    } else {
      fieldsModified.push('filesCount')
    }

    if (this.statistics.source.totalTasks === this.statistics.cloned.totalTasks) {
      fieldsPreserved.push('totalTasks')
    } else {
      fieldsModified.push('totalTasks')
    }

    this.statistics.completeness.fieldsPreserved = fieldsPreserved
    this.statistics.completeness.fieldsModified = fieldsModified
    this.statistics.completeness.fieldsRemoved = fieldsRemoved

    // Calculate completeness percentage
    const totalFields = 6 // name, description, variant, blocks, files, tasks
    const preservedCount = fieldsPreserved.length
    const hasErrors =
      this.statistics.errors.missingFiles.length > 0 ||
      this.statistics.errors.failedTasks.length > 0

    let percentComplete = Math.round((preservedCount / totalFields) * 100)
    if (hasErrors) {
      // Reduce completeness based on number of errors
      const errorPenalty = Math.min(30, this.statistics.errors.missingFiles.length * 5) // 5% per error, max 30%
      percentComplete = Math.max(50, percentComplete - errorPenalty) // Minimum 50% if there are errors
    }

    this.statistics.completeness.percentComplete = percentComplete

    return this.statistics
  }

  /**
   * Get current statistics (without finalizing)
   */
  getStatistics(): CloneStatistics {
    return this.statistics
  }

  /**
   * Get source document IDs
   */
  getSourceDocumentIds(): Set<number> {
    return this.sourceDocumentIds
  }

  /**
   * Get cloned document IDs
   */
  getClonedDocumentIds(): Set<number> {
    return this.clonedDocumentIds
  }
}
