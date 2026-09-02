import { isRecord, isUnknownArray } from '@/payload/assertions'
import { normalizeDocumentRelationships } from '@/payload/utilities/cloning/normalize-document-relationships'

/**
 * Normalizes rich text content to ensure consistent handling of document relationships.
 * Converts any resolved entities to unresolved format before processing.
 */
export function normalizeRichText(richText: unknown): unknown {
  if (!richText || typeof richText !== 'object') {
    return richText
  }

  // Handle Lexical format (has root property)
  if (isRecord(richText) && richText.root) {
    return {
      ...richText,
      root: normalizeDocumentRelationships(richText.root),
    }
  }

  // Handle Slate format (array)
  if (isUnknownArray(richText)) {
    return richText.map((node) => normalizeDocumentRelationships(node))
  }

  // Handle single node
  return normalizeDocumentRelationships(richText)
}
