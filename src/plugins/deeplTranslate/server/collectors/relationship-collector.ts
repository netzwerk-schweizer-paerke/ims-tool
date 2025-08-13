/**
 * Singleton class to collect relationships that need to be translated
 * This allows us to gather all relationships first, then translate them in a controlled manner
 */

export interface RelatedDocument {
  collectionSlug: string
  id: string | number
  depth: number
  path: string // For debugging - shows where this relationship was found
}

class RelationshipCollector {
  private static instance: RelationshipCollector | null = null
  private documents: Map<string, RelatedDocument> = new Map()
  private enabled: boolean = false

  private constructor() {}

  static getInstance(): RelationshipCollector {
    if (!RelationshipCollector.instance) {
      RelationshipCollector.instance = new RelationshipCollector()
    }
    return RelationshipCollector.instance
  }

  /**
   * Start collecting relationships
   */
  startCollecting(): void {
    this.enabled = true
    this.documents.clear()
  }

  /**
   * Stop collecting and return collected documents
   */
  stopCollecting(): RelatedDocument[] {
    this.enabled = false
    const results = Array.from(this.documents.values())
    return results
  }

  /**
   * Add a document to the collection
   */
  addDocument(collectionSlug: string, id: string | number, depth: number, path: string): void {
    if (!this.enabled) return

    // TODO: Make this configurable through plugin options
    // Currently hardcoded to only collect task-lists and task-flows
    if (collectionSlug !== 'task-lists' && collectionSlug !== 'task-flows') {
      return
    }

    const key = `${collectionSlug}/${id}`

    if (this.documents.has(key)) {
      const existing = this.documents.get(key)!
      // Keep the one with higher depth (more complete traversal)
      if (depth > existing.depth) {
        this.documents.set(key, { collectionSlug, id, depth, path })
      }
    } else {
      this.documents.set(key, { collectionSlug, id, depth, path })
    }
  }

  /**
   * Get all collected documents
   */
  getDocuments(): RelatedDocument[] {
    return Array.from(this.documents.values())
  }

  /**
   * Clear the collection
   */
  clear(): void {
    this.documents.clear()
    this.enabled = false
  }

  /**
   * Check if collecting is enabled
   */
  isCollecting(): boolean {
    return this.enabled
  }

  /**
   * Get summary of collected documents
   */
  getSummary(): { total: number; byCollection: Record<string, number> } {
    const byCollection: Record<string, number> = {}

    for (const doc of this.documents.values()) {
      byCollection[doc.collectionSlug] = (byCollection[doc.collectionSlug] || 0) + 1
    }

    return {
      total: this.documents.size,
      byCollection,
    }
  }
}

export const relationshipCollector = RelationshipCollector.getInstance()
