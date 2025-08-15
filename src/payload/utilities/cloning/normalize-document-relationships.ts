import { isObject } from 'es-toolkit/compat'

/**
 * Normalizes resolved document entities to unresolved format.
 * Converts { value: { id: 123, ... } } to { value: 123 }
 */
export function normalizeDocumentRelationships(node: any): any {
  if (!node || typeof node !== 'object') return node

  // Create a shallow copy to avoid mutating the original
  const normalizedNode = Array.isArray(node) ? [...node] : { ...node }

  // Handle link nodes with document relationships
  if (normalizedNode.type === 'link' && normalizedNode.fields?.doc?.value) {
    // Check if it's a resolved entity (value is an object with an id)
    if (isObject(normalizedNode.fields.doc.value) && 'id' in normalizedNode.fields.doc.value) {
      // Convert resolved to unresolved by extracting just the ID
      normalizedNode.fields = {
        ...normalizedNode.fields,
        doc: {
          ...normalizedNode.fields.doc,
          value: normalizedNode.fields.doc.value.id,
        },
      }
    }
  }

  // Handle upload nodes with resolved documents
  if (normalizedNode.type === 'upload') {
    // For Slate format upload nodes
    if (isObject(normalizedNode.value) && 'id' in normalizedNode.value) {
      // Store just the ID for processing
      normalizedNode.value = { id: normalizedNode.value.id }
    }

    // For Lexical format upload nodes (fields.value structure)
    if (isObject(normalizedNode.fields?.value) && 'id' in normalizedNode.fields.value) {
      normalizedNode.fields = {
        ...normalizedNode.fields,
        value: { id: normalizedNode.fields.value.id },
      }
    }
  }

  // Recursively process children nodes
  if (normalizedNode.children && Array.isArray(normalizedNode.children)) {
    normalizedNode.children = normalizedNode.children.map((child: any) =>
      normalizeDocumentRelationships(child),
    )
  }

  // Handle Lexical root structure
  if (normalizedNode.root) {
    normalizedNode.root = normalizeDocumentRelationships(normalizedNode.root)
  }

  return normalizedNode
}
