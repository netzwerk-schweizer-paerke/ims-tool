/**
 * Scans content structures to extract all document IDs that will be needed for cloning
 * This allows pre-loading documents before starting the transaction
 */

import { isRecord, isUnknownArray } from '@/payload/assertions'

/**
 * Scans an activity for all document IDs that will need to be cloned
 */
export function scanActivityForDocumentIds(activity: unknown): number[] {
  const documentIds: number[] = []

  if (!isRecord(activity)) {
    return documentIds
  }

  // Direct file references
  if (isUnknownArray(activity.files)) {
    for (const fileRef of activity.files) {
      documentIds.push(...readFileReferenceId(fileRef))
    }
  }

  // Rich text content in blocks
  if (isUnknownArray(activity.blocks)) {
    for (const block of activity.blocks) {
      documentIds.push(...scanForDocumentIds(block))
    }
  }

  // Description field
  if (activity.description) {
    documentIds.push(...scanForDocumentIds(activity.description))
  }

  return documentIds
}

export function scanForDocumentIds(content: unknown): number[] {
  const documentIds: number[] = []

  // Handle arrays
  if (isUnknownArray(content)) {
    for (const item of content) {
      documentIds.push(...scanForDocumentIds(item))
    }
    return documentIds
  }

  if (!isRecord(content)) {
    return documentIds
  }

  // Handle Lexical rich text (has root property)
  if (content.root) {
    documentIds.push(...scanNode(content.root))
    return documentIds
  }

  // Handle general object traversal
  for (const [key, value] of Object.entries(content)) {
    // Common rich text fields, plus any nested object worth traversing.
    if (
      ['blocks', 'content', 'description'].includes(key) ||
      (typeof value === 'object' && value !== null)
    ) {
      documentIds.push(...scanForDocumentIds(value))
    }
  }

  return documentIds
}

/**
 * Scans a task flow for all document IDs that will need to be cloned
 */
export function scanTaskFlowForDocumentIds(taskFlow: unknown): number[] {
  const documentIds: number[] = []

  if (!isRecord(taskFlow)) {
    return documentIds
  }

  // Direct file references
  if (isUnknownArray(taskFlow.files)) {
    for (const fileRef of taskFlow.files) {
      documentIds.push(...readFileReferenceId(fileRef))
    }
  }

  // Description field
  if (taskFlow.description) {
    documentIds.push(...scanForDocumentIds(taskFlow.description))
  }

  // Task content
  if (isUnknownArray(taskFlow.tasks)) {
    for (const task of taskFlow.tasks) {
      if (isRecord(task) && task.content) {
        documentIds.push(...scanForDocumentIds(task.content))
      }
    }
  }

  return documentIds
}

/**
 * Scans a task list for all document IDs that will need to be cloned
 */
export function scanTaskListForDocumentIds(taskList: unknown): number[] {
  const documentIds: number[] = []

  if (!isRecord(taskList)) {
    return documentIds
  }

  // Direct file references
  if (isUnknownArray(taskList.files)) {
    for (const fileRef of taskList.files) {
      documentIds.push(...readFileReferenceId(fileRef))
    }
  }

  // Description field
  if (taskList.description) {
    documentIds.push(...scanForDocumentIds(taskList.description))
  }

  // Task content
  if (isUnknownArray(taskList.tasks)) {
    for (const task of taskList.tasks) {
      if (isRecord(task) && task.description) {
        documentIds.push(...scanForDocumentIds(task.description))
      }
    }
  }

  return documentIds
}

/**
 * Reads the document id from one `files` row, which holds either a raw id or a populated document.
 */
function readFileReferenceId(fileRef: unknown): number[] {
  if (!isRecord(fileRef)) {
    return []
  }

  const { document } = fileRef

  if (typeof document === 'number') {
    return [document]
  }

  if (isRecord(document) && typeof document.id === 'number') {
    return [document.id]
  }

  return []
}

function scanNode(node: unknown): number[] {
  const documentIds: number[] = []

  if (!isRecord(node)) {
    return documentIds
  }

  // Handle document relationships in links
  if (node.type === 'link' && isRecord(node.fields) && isRecord(node.fields.doc)) {
    const relationship = node.fields.doc

    if (relationship.relationTo === 'documents' && relationship.value) {
      const docId = isRecord(relationship.value) ? relationship.value.id : relationship.value
      if (typeof docId === 'number') {
        documentIds.push(docId)
      }
    }
  }

  // Recursively scan children
  if (isUnknownArray(node.children)) {
    for (const child of node.children) {
      documentIds.push(...scanNode(child))
    }
  }

  return documentIds
}
