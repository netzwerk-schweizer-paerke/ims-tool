/**
 * Scans content structures to extract all document IDs that will be needed for cloning
 * This allows pre-loading documents before starting the transaction
 */

export function scanForDocumentIds(content: any): number[] {
  const documentIds: number[] = []

  if (!content || typeof content !== 'object') {
    return documentIds
  }

  // Handle arrays
  if (Array.isArray(content)) {
    for (const item of content) {
      documentIds.push(...scanForDocumentIds(item))
    }
    return documentIds
  }

  // Handle Lexical rich text (has root property)
  if (content.root) {
    documentIds.push(...scanNode(content.root))
    return documentIds
  }

  // Handle general object traversal
  for (const [key, value] of Object.entries(content)) {
    if (key === 'blocks' || key === 'content' || key === 'description') {
      // These are common rich text fields
      documentIds.push(...scanForDocumentIds(value))
    } else if (typeof value === 'object' && value !== null) {
      documentIds.push(...scanForDocumentIds(value))
    }
  }

  return documentIds
}

function scanNode(node: any): number[] {
  const documentIds: number[] = []

  if (!node || typeof node !== 'object') {
    return documentIds
  }

  // Handle document relationships in links
  if (node.type === 'link' && node.fields?.doc) {
    const relationship = node.fields.doc

    if (relationship.relationTo === 'documents' && relationship.value) {
      const docId =
        typeof relationship.value === 'object' ? relationship.value.id : relationship.value
      if (typeof docId === 'number') {
        documentIds.push(docId)
      }
    }
  }

  // Recursively scan children
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      documentIds.push(...scanNode(child))
    }
  }

  return documentIds
}

/**
 * Scans an activity for all document IDs that will need to be cloned
 */
export function scanActivityForDocumentIds(activity: any): number[] {
  const documentIds: number[] = []

  if (!activity) {
    return documentIds
  }

  // Direct file references
  if (Array.isArray(activity.files)) {
    for (const fileRef of activity.files) {
      if (fileRef.document && typeof fileRef.document === 'number') {
        documentIds.push(fileRef.document)
      } else if (fileRef.document?.id) {
        documentIds.push(fileRef.document.id)
      }
    }
  }

  // Rich text content in blocks
  if (Array.isArray(activity.blocks)) {
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

/**
 * Scans a task flow for all document IDs that will need to be cloned
 */
export function scanTaskFlowForDocumentIds(taskFlow: any): number[] {
  const documentIds: number[] = []

  if (!taskFlow) {
    return documentIds
  }

  // Direct file references
  if (Array.isArray(taskFlow.files)) {
    for (const fileRef of taskFlow.files) {
      if (fileRef.document && typeof fileRef.document === 'number') {
        documentIds.push(fileRef.document)
      } else if (fileRef.document?.id) {
        documentIds.push(fileRef.document.id)
      }
    }
  }

  // Description field
  if (taskFlow.description) {
    documentIds.push(...scanForDocumentIds(taskFlow.description))
  }

  // Task content
  if (Array.isArray(taskFlow.tasks)) {
    for (const task of taskFlow.tasks) {
      if (task.content) {
        documentIds.push(...scanForDocumentIds(task.content))
      }
    }
  }

  return documentIds
}

/**
 * Scans a task list for all document IDs that will need to be cloned
 */
export function scanTaskListForDocumentIds(taskList: any): number[] {
  const documentIds: number[] = []

  if (!taskList) {
    return documentIds
  }

  // Direct file references
  if (Array.isArray(taskList.files)) {
    for (const fileRef of taskList.files) {
      if (fileRef.document && typeof fileRef.document === 'number') {
        documentIds.push(fileRef.document)
      } else if (fileRef.document?.id) {
        documentIds.push(fileRef.document.id)
      }
    }
  }

  // Description field
  if (taskList.description) {
    documentIds.push(...scanForDocumentIds(taskList.description))
  }

  // Task content
  if (Array.isArray(taskList.tasks)) {
    for (const task of taskList.tasks) {
      if (task.description) {
        documentIds.push(...scanForDocumentIds(task.description))
      }
    }
  }

  return documentIds
}
