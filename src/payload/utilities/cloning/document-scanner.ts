/**
 * Scans content structures to extract all document IDs that will be needed for cloning
 * This allows pre-loading documents before starting the transaction
 */

import { isRecord, isUnknownArray } from '@/payload/assertions'

/** One task a block of an activity names. */
export type TaskRelationRef = {
  collection: 'task-flows' | 'task-lists'
  id: number
}

/**
 * Scans an activity for all document IDs that will need to be cloned
 */
export function scanActivityForDocumentIds(activity: unknown): number[] {
  const documentIds: number[] = []

  if (!isRecord(activity)) {
    return documentIds
  }

  documentIds.push(...scanFileRows(activity.files))

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

/**
 * Reads the task flows and task lists the blocks of one activity locale name.
 *
 * A relation holds the task id or the populated task, depending on the depth of the read. The
 * task carries locales of its own, so the caller reads each one for the scan.
 */
export function scanActivityForTaskRelations(activity: unknown): TaskRelationRef[] {
  const relations: TaskRelationRef[] = []

  if (!isRecord(activity) || !isUnknownArray(activity.blocks)) {
    return relations
  }

  for (const block of activity.blocks) {
    if (!isRecord(block) || !isRecord(block.relations) || !isUnknownArray(block.relations.tasks)) {
      continue
    }

    for (const task of block.relations.tasks) {
      if (!isRecord(task)) {
        continue
      }

      const { relationTo, value } = task

      if (relationTo !== 'task-flows' && relationTo !== 'task-lists') {
        continue
      }

      const id = readRelationId(value)

      if (id !== undefined) {
        relations.push({ collection: relationTo, id })
      }
    }
  }

  return relations
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
    // A task an activity block names arrives populated, with its own `files` rows. Those rows
    // hold no rich text, so the generic walk below would pass them by.
    if (key === 'files' && isUnknownArray(value)) {
      documentIds.push(...scanFileRows(value))
      continue
    }

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
  if (!isRecord(taskFlow)) {
    return []
  }

  return [
    ...scanFileRows(taskFlow.files),
    ...scanForDocumentIds(taskFlow.description),
    ...scanForDocumentIds(taskFlow.blocks),
  ]
}

/** Scans one task of either collection. */
export function scanTaskForDocumentIds(
  collection: TaskRelationRef['collection'],
  task: unknown,
): number[] {
  return collection === 'task-flows'
    ? scanTaskFlowForDocumentIds(task)
    : scanTaskListForDocumentIds(task)
}

/**
 * Scans a task list for all document IDs that will need to be cloned
 */
export function scanTaskListForDocumentIds(taskList: unknown): number[] {
  if (!isRecord(taskList)) {
    return []
  }

  return [
    ...scanFileRows(taskList.files),
    ...scanForDocumentIds(taskList.description),
    ...scanForDocumentIds(taskList.items),
  ]
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

/** Reads the id of a relation, which holds either the raw id or the populated record. */
function readRelationId(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value
  }

  if (isRecord(value) && typeof value.id === 'number') {
    return value.id
  }

  return undefined
}

/** Reads the document ids of a `files` array, and answers nothing for any other value. */
function scanFileRows(files: unknown): number[] {
  if (!isUnknownArray(files)) {
    return []
  }

  return files.flatMap((fileRef) => readFileReferenceId(fileRef))
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
