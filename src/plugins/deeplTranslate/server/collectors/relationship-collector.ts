/**
 * Collects the related documents that a translation must also translate.
 *
 * Create one collector per request with `createRelationshipCollector()`. An earlier
 * version exported a single shared instance, so two concurrent translations
 * overwrote each other's collected ids.
 */

export interface RelatedDocument {
  collectionSlug: string
  depth: number
  id: number | string
  path: string // For debugging - shows where this relationship was found
}

export class RelationshipCollector {
  private documents: Map<string, RelatedDocument> = new Map()

  /**
   * Add a document to the collection
   */
  addDocument(collectionSlug: string, id: number | string, depth: number, path: string): void {
    // TODO: Make this configurable through plugin options
    // Currently hardcoded to only collect task-lists and task-flows
    if (collectionSlug !== 'task-lists' && collectionSlug !== 'task-flows') {
      return
    }

    const key = `${collectionSlug}/${id}`

    const existing = this.documents.get(key)

    // Keep the one with higher depth (more complete traversal)
    if (existing && depth <= existing.depth) {
      return
    }

    this.documents.set(key, { collectionSlug, depth, id, path })
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
  getSummary(): { byCollection: Record<string, number>; total: number } {
    const byCollection: Record<string, number> = {}

    for (const doc of this.documents.values()) {
      byCollection[doc.collectionSlug] = (byCollection[doc.collectionSlug] || 0) + 1
    }

    return {
      byCollection,
      total: this.documents.size,
    }
  }
}

export const createRelationshipCollector = (): RelationshipCollector => new RelationshipCollector()
