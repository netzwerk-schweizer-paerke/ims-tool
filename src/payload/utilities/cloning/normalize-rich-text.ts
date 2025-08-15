import { normalizeDocumentRelationships } from '@/payload/utilities/cloning/normalize-document-relationships'

/**
 * Normalizes rich text content to ensure consistent handling of document relationships.
 * Converts any resolved entities to unresolved format before processing.
 */
export function normalizeRichText(richText: any): any {
  if (!richText || typeof richText !== 'object') {
    return richText
  }

  // Handle Lexical format (has root property)
  if (richText.root) {
    return {
      ...richText,
      root: normalizeDocumentRelationships(richText.root),
    }
  }

  // Handle Slate format (array)
  if (Array.isArray(richText)) {
    return richText.map((node) => normalizeDocumentRelationships(node))
  }

  // Handle single node
  return normalizeDocumentRelationships(richText)
}
