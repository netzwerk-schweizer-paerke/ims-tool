import { isRecord, isUnknownArray } from '@/payload/assertions'

/**
 * Normalizes resolved document entities to unresolved format.
 * Converts { value: { id: 123, ... } } to { value: 123 }
 */
export function normalizeDocumentRelationships(node: unknown): unknown {
  if (!node || typeof node !== 'object') return node

  // Create a shallow copy to avoid mutating the original
  if (isUnknownArray(node)) return [...node]
  if (!isRecord(node)) return node

  const normalizedNode: Record<string, unknown> = { ...node }

  // Handle link nodes with document relationships
  // Check if it's a resolved entity (value is an object with an id)
  const linkFields = normalizedNode.fields
  if (
    normalizedNode.type === 'link' &&
    isRecord(linkFields) &&
    isRecord(linkFields.doc) &&
    isRecord(linkFields.doc.value) &&
    'id' in linkFields.doc.value
  ) {
    // Convert resolved to unresolved by extracting just the ID
    normalizedNode.fields = {
      ...linkFields,
      doc: {
        ...linkFields.doc,
        value: linkFields.doc.value.id,
      },
    }
  }

  // Handle upload nodes with resolved documents
  if (normalizedNode.type === 'upload') {
    // For Slate format upload nodes
    const uploadValue = normalizedNode.value
    if (isRecord(uploadValue) && 'id' in uploadValue) {
      // Store just the ID for processing
      normalizedNode.value = { id: uploadValue.id }
    }

    // For Lexical format upload nodes (fields.value structure)
    const uploadFields = normalizedNode.fields
    if (isRecord(uploadFields) && isRecord(uploadFields.value) && 'id' in uploadFields.value) {
      normalizedNode.fields = {
        ...uploadFields,
        value: { id: uploadFields.value.id },
      }
    }
  }

  // Recursively process children nodes
  const children = normalizedNode.children
  if (isUnknownArray(children)) {
    normalizedNode.children = children.map((child) => normalizeDocumentRelationships(child))
  }

  // Handle Lexical root structure
  if (normalizedNode.root) {
    normalizedNode.root = normalizeDocumentRelationships(normalizedNode.root)
  }

  return normalizedNode
}
