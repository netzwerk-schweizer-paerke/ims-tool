/**
 * Singleton class to collect relationships that need to be translated
 * This allows us to gather all relationships first, then translate them in a controlled manner
 */

export interface RelatedDocument {
  collectionSlug: string
  depth: number
  id: number | string
  path: string // For debugging - shows where this relationship was found
}

class RelationshipCollector {
  private static instance: null | RelationshipCollector = null
  private documents: Map<string, RelatedDocument> = new Map()
  private enabled: boolean = false

  private constructor() {}

  static getInstance(): RelationshipCollector {
    if (!this.instance) {
      this.instance = new RelationshipCollector()
    }
    return this.instance
  }

  /**
   * Add a document to the collection
   */
  addDocument(collectionSlug: string, id: number | string, depth: number, path: string): void {
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
        this.documents.set(key, { collectionSlug, depth, id, path })
      }
    } else {
      this.documents.set(key, { collectionSlug, depth, id, path })
    }
  }

  /**
   * Clear the collection
   */
  clear(): void {
    this.documents.clear()
    this.enabled = false
  }

  /**
   * Get all collected documents
   */
  getDocuments(): RelatedDocument[] {
    return Array.from(this.documents.values())
  }

  /**
   * Get summary of collected documents
   */
  getSummary(): { byCollection: Record<string, number>; total: number; } {
    const byCollection: Record<string, number> = {}

    for (const doc of this.documents.values()) {
      byCollection[doc.collectionSlug] = (byCollection[doc.collectionSlug] || 0) + 1
    }

    return {
      byCollection,
      total: this.documents.size,
    }
  }

  /**
   * Check if collecting is enabled
   */
  isCollecting(): boolean {
    return this.enabled
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
}

export const relationshipCollector = RelationshipCollector.getInstance()
