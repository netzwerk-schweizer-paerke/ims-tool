import { isArray, isString } from 'es-toolkit/compat'
import { CollectionAfterReadHook, PayloadRequest, Where } from 'payload'

import {
  DocumentUsage,
  DocumentUsageReference,
  SKIP_DOCUMENT_USAGE_CONTEXT_KEY,
} from '@/lib/document-usage'
import { getLocaleCodesFromRequest, getLocalizedValue } from '@/lib/locale-utils'
import { isRecord } from '@/payload/assertions'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

/** The part of a block reference that says which field inside the block holds the document. */
interface BlockFieldInfo {
  blockId?: string
  blockType?: string
  field?: string
  taskIndex?: number
}

/** Where a document reference sits inside a `blocks` array. */
interface BlockReferenceDetails extends BlockFieldInfo {
  blockIndex: number
  locale?: string
  path: string
}

/** Where a document reference sits inside a `description` field. */
interface DescriptionReference {
  locale?: string
  path: string
}

/** Where a document reference sits inside the `items` array of a task list. */
interface ItemReferenceDetails {
  itemIndex: number
  locale?: string
  path: string
}

type ReferencingCollection = 'activities' | 'task-flows' | 'task-lists'

/**
 * The rows one scan may see. The Local API bypasses access control, so a scan without a bound
 * names the records of every organisation to whoever reads the document.
 *
 * A document that names an organisation scans that organisation. A document without one, which
 * is every `documents-public` row, scans within the caller's own read access, because the shared
 * pool has no organisation that could own its references.
 */
interface ScanScope {
  /** `true` turns a denied access rule into an empty page instead of a thrown `Forbidden`. */
  disableErrors: boolean
  overrideAccess: boolean
  /** `true` when the caller's read access bounds the scan, so the list may be partial. */
  partial: boolean
  where?: Where
}

/** What every scan needs, beside the collection it reads. */
interface ScanTarget {
  /**
   * `documents` or `documents-public`. The two have independent id sequences, so a reference
   * matches only when its `relationTo` names the collection being read.
   */
  collectionSlug: string
  documentId: number
  locales: string[]
  req: PayloadRequest
  scope: ScanScope
}

/** The scan of every organisation, for the count of the references the caller cannot see. */
const EVERY_ORGANISATION: ScanScope = { disableErrors: false, overrideAccess: true, partial: false }

const REFERENCING_COLLECTIONS: ReferencingCollection[] = ['activities', 'task-flows', 'task-lists']

/**
 * Hook to add usage information to documents
 * Shows where this document is referenced in activities, task flows and task lists
 * Checks both direct file references and rich text field references
 */
export const addUsageInfoAfterReadHook: CollectionAfterReadHook = async ({
  collection,
  context,
  doc,
  findMany,
  req,
}) => {
  // A list view skips the scan for performance. `findByID`, `create` and `delete` pass no
  // `findMany`, so an internal caller opts out through the context flag instead.
  if (findMany || !doc || context[SKIP_DOCUMENT_USAGE_CONTEXT_KEY] === true) {
    return doc
  }

  const target: ScanTarget = {
    collectionSlug: collection.slug,
    documentId: doc.id,
    locales: getLocaleCodesFromRequest(req),
    req,
    scope: resolveScanScope(doc.organisation),
  }

  try {
    const usedIn: DocumentUsage = {
      activities: await findActivityReferences(target),
      taskFlows: await findTaskFlowReferences(target),
      taskLists: await findTaskListReferences(target),
    }

    // The caller's access hid rows on this path. A bare count tells the person at the sidebar
    // that other parks use the document. The opt-out above keeps this pass off the clone.
    if (target.scope.partial) {
      usedIn.hiddenReferenceCount = await countHiddenReferences(target, usedIn)
    }

    return {
      ...doc,
      usageCount: usedIn.activities.length + usedIn.taskFlows.length + usedIn.taskLists.length,
      usedIn,
    }
  } catch (error) {
    // The read succeeds without the usage, and the sidebar then shows the document as unused.
    req.payload.logger.error(
      {
        collection: collection.slug,
        documentId: doc.id,
        error: error instanceof Error ? error.message : String(error),
      },
      '[Document Usage Hook] Error',
    )
    return doc
  }
}

/** Whether the `files` array of a row attaches the document, as a bare id or a populated row. */
function attachesDocument(row: unknown, documentId: number): boolean {
  if (!isRecord(row) || !isArray(row.files)) return false

  return row.files.some((file) => isRecord(file) && getIdFromRelation(file.document) === documentId)
}

/**
 * Recursively check any value for document references
 * Handles both rich text fields and nested structures
 */
function checkForDocumentReference(
  value: unknown,
  documentId: number,
  collectionSlug: string,
): boolean {
  if (!value) return false

  // If it's a rich text field
  if (isRecord(value) && value.root) {
    return isDocumentReferencedInRichText(value, documentId, collectionSlug)
  }

  // If it's an array, check each item
  if (isArray(value)) {
    return value.some((item) => checkForDocumentReference(item, documentId, collectionSlug))
  }

  // If it's an object, check all properties
  if (isRecord(value)) {
    return Object.values(value).some((val) =>
      checkForDocumentReference(val, documentId, collectionSlug),
    )
  }

  return false
}

/**
 * Counts the rows whose `files` array attaches the document, without loading them. The relation
 * points at `documents` only, so a `documents-public` row has none.
 */
async function countAttachments(
  target: ScanTarget,
  collection: ReferencingCollection,
): Promise<number> {
  if (target.collectionSlug !== 'documents') {
    return 0
  }

  const result = await target.req.payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req: target.req,
    where: { 'files.document': { equals: target.documentId } },
  })

  return result.totalDocs
}

/**
 * Counts the references the caller's read access hides, as a bare number for the sidebar.
 *
 * It runs one pass over every organisation. An attachment comes from `totalDocs` of a `limit: 1`
 * query, and the walk covers the rows without one. Nothing of that pass reaches the returned
 * value except the count.
 */
async function countHiddenReferences(target: ScanTarget, visible: DocumentUsage): Promise<number> {
  const visibleCount =
    visible.activities.length + visible.taskFlows.length + visible.taskLists.length
  let total = 0

  for (const collection of REFERENCING_COLLECTIONS) {
    total += await countReferences(target, collection)
  }

  // A row written between the two passes can make the difference negative.
  return Math.max(0, total - visibleCount)
}

/** Counts every row of one collection that references the document, whoever may read it. */
async function countReferences(
  target: ScanTarget,
  collection: ReferencingCollection,
): Promise<number> {
  const attached = await countAttachments(target, collection)
  let linked = 0

  for (const row of await findScopedRows(target, collection, EVERY_ORGANISATION)) {
    // The query above counted the rows with an attachment, and a row counts once.
    if (attached > 0 && attachesDocument(row, target.documentId)) continue

    if (referencesDocumentInContent(row, target)) linked += 1
  }

  return attached + linked
}

/** Finds the block that holds the document, with the field inside the block when it is known. */
function findActivityBlockReference(
  blocks: unknown[],
  locale: string | undefined,
  target: ScanTarget,
): BlockReferenceDetails | null {
  const { collectionSlug, documentId } = target

  for (let i = 0; i < blocks.length; i++) {
    const block: unknown = blocks[i]

    if (!checkForDocumentReference(block, documentId, collectionSlug)) {
      continue
    }

    // Try to get more specific location
    let fieldPath = ''
    const blockRecord: Record<string, unknown> = isRecord(block) ? block : {}
    const blockType = isString(blockRecord.blockType) ? blockRecord.blockType : undefined
    const blockInfo: BlockFieldInfo = {
      blockId: isString(blockRecord.id) ? blockRecord.id : undefined,
      blockType,
    }

    // Check specific fields based on block type
    if (blockType === 'activity-io') {
      const io = blockRecord.io
      const infos = blockRecord.infos
      if (io && checkForDocumentReference(io, documentId, collectionSlug)) {
        fieldPath = locale ? `blocks.${locale}[${i}].io` : `blocks[${i}].io`
        blockInfo.field = 'io'
      } else if (infos && checkForDocumentReference(infos, documentId, collectionSlug)) {
        fieldPath = locale ? `blocks.${locale}[${i}].infos` : `blocks[${i}].infos`
        blockInfo.field = 'infos'
      }
    } else if (blockType === 'activity-task') {
      const relations = blockRecord.relations
      const tasks = isRecord(relations) ? relations.tasks : undefined
      if (isArray(tasks)) {
        for (let j = 0; j < tasks.length; j++) {
          const task: unknown = tasks[j]
          if (checkForDocumentReference(task, documentId, collectionSlug)) {
            fieldPath = locale
              ? `blocks.${locale}[${i}].relations.tasks[${j}]`
              : `blocks[${i}].relations.tasks[${j}]`
            blockInfo.field = 'relations.tasks'
            blockInfo.taskIndex = j
            break
          }
        }
      }
    }

    return {
      ...blockInfo,
      blockIndex: i,
      locale,
      path: fieldPath || (locale ? `blocks.${locale}[${i}]` : `blocks[${i}]`),
    }
  }

  return null
}

async function findActivityReferences(target: ScanTarget): Promise<DocumentUsageReference[]> {
  const references = await findFileReferences(target, 'activities', 'Activity')

  for (const activity of await findScopedRows(target, 'activities')) {
    // Skip if already found via file reference
    if (references.some((entry) => entry.id === activity.id)) continue

    const name = nameOf(activity.name, target.locales, `Activity ${activity.id}`)
    const description = findDescriptionReference(activity.description, target)

    if (description) {
      references.push({
        field: 'description',
        id: activity.id,
        locale: description.locale,
        name,
        path: description.path,
        referenceType: 'richtext',
      })
      continue
    }

    const block = searchLocalizedRows(activity.blocks, target.locales, (rows, locale) =>
      findActivityBlockReference(rows, locale, target),
    )

    if (block) {
      references.push({
        blockId: block.blockId,
        blockType: block.blockType,
        field: block.field || 'blocks',
        id: activity.id,
        locale: block.locale,
        name,
        path: block.path,
        referenceType: 'richtext-block',
      })
    }
  }

  return references
}

/** Finds the block that holds the document, without a look inside the block. */
function findBlockReference(
  blocks: unknown[],
  locale: string | undefined,
  target: ScanTarget,
): BlockReferenceDetails | null {
  for (let i = 0; i < blocks.length; i++) {
    const block: unknown = blocks[i]

    if (checkForDocumentReference(block, target.documentId, target.collectionSlug)) {
      const blockRecord: Record<string, unknown> = isRecord(block) ? block : {}

      return {
        blockId: isString(blockRecord.id) ? blockRecord.id : undefined,
        blockIndex: i,
        blockType: isString(blockRecord.blockType) ? blockRecord.blockType : undefined,
        locale,
        path: locale ? `blocks.${locale}[${i}]` : `blocks[${i}]`,
      }
    }
  }

  return null
}

/**
 * The one walk over a `description` field for the three collections, so a hit carries one path
 * format everywhere: `description` for a single Lexical document, and `description.<locale>`
 * with `locale` for a localized one. The clone report copies this path into `usageLocation`.
 */
function findDescriptionReference(
  description: unknown,
  target: ScanTarget,
): DescriptionReference | null {
  if (!isRecord(description)) {
    return null
  }

  if (description.root) {
    return isDocumentReferencedInRichText(description, target.documentId, target.collectionSlug)
      ? { path: 'description' }
      : null
  }

  for (const locale of target.locales) {
    const value = description[locale]

    if (value && isDocumentReferencedInRichText(value, target.documentId, target.collectionSlug)) {
      return { locale, path: `description.${locale}` }
    }
  }

  return null
}

/**
 * The rows whose `files` array attaches the document.
 *
 * The `files.document` relation points at `documents` only, so this runs for that slug alone. A
 * `documents-public` id in the query would match an unrelated row.
 */
async function findFileReferences(
  target: ScanTarget,
  collection: ReferencingCollection,
  label: string,
): Promise<DocumentUsageReference[]> {
  if (target.collectionSlug !== 'documents') {
    return []
  }

  const result = await target.req.payload.find({
    collection,
    depth: 0,
    disableErrors: target.scope.disableErrors,
    limit: 100,
    locale: 'all',
    overrideAccess: target.scope.overrideAccess,
    req: target.req,
    where: scopedWhere(target.scope, { 'files.document': { equals: target.documentId } }),
  })

  return result.docs.map((row) => ({
    field: 'files',
    id: row.id,
    name: nameOf(row.name, target.locales, `${label} ${row.id}`),
    path: 'files.document',
    referenceType: 'file',
  }))
}

function findItemReference(
  items: unknown[],
  locale: string | undefined,
  target: ScanTarget,
): ItemReferenceDetails | null {
  for (let i = 0; i < items.length; i++) {
    if (checkForDocumentReference(items[i], target.documentId, target.collectionSlug)) {
      return { itemIndex: i, locale, path: locale ? `items.${locale}[${i}]` : `items[${i}]` }
    }
  }

  return null
}

/**
 * Every row of the collection within the scope, for the rich text walk. Depth 2 reaches the
 * nested block content, and `locale: 'all'` returns each localized field keyed by locale.
 */
async function findScopedRows<TSlug extends ReferencingCollection>(
  target: ScanTarget,
  collection: TSlug,
  scope: ScanScope = target.scope,
) {
  const result = await target.req.payload.find({
    collection,
    depth: 2,
    disableErrors: scope.disableErrors,
    limit: 1000,
    locale: 'all',
    overrideAccess: scope.overrideAccess,
    req: target.req,
    where: scope.where,
  })

  return result.docs
}

async function findTaskFlowReferences(target: ScanTarget): Promise<DocumentUsageReference[]> {
  const references = await findFileReferences(target, 'task-flows', 'TaskFlow')

  for (const taskFlow of await findScopedRows(target, 'task-flows')) {
    if (references.some((entry) => entry.id === taskFlow.id)) continue

    const name = nameOf(taskFlow.name, target.locales, `TaskFlow ${taskFlow.id}`)
    const description = findDescriptionReference(taskFlow.description, target)

    if (description) {
      references.push({
        field: 'description',
        id: taskFlow.id,
        locale: description.locale,
        name,
        path: description.path,
        referenceType: 'richtext',
      })
      continue
    }

    const block = searchLocalizedRows(taskFlow.blocks, target.locales, (rows, locale) =>
      findBlockReference(rows, locale, target),
    )

    if (block) {
      references.push({
        blockId: block.blockId,
        blockType: block.blockType,
        field: 'blocks',
        id: taskFlow.id,
        locale: block.locale,
        name,
        path: block.path,
        referenceType: 'richtext',
      })
    }
  }

  return references
}

async function findTaskListReferences(target: ScanTarget): Promise<DocumentUsageReference[]> {
  const references = await findFileReferences(target, 'task-lists', 'TaskList')

  for (const taskList of await findScopedRows(target, 'task-lists')) {
    if (references.some((entry) => entry.id === taskList.id)) continue

    const name = nameOf(taskList.name, target.locales, `TaskList ${taskList.id}`)
    const description = findDescriptionReference(taskList.description, target)

    if (description) {
      references.push({
        field: 'description',
        id: taskList.id,
        locale: description.locale,
        name,
        path: description.path,
        referenceType: 'richtext',
      })
      continue
    }

    const item = searchLocalizedRows(taskList.items, target.locales, (rows, locale) =>
      findItemReference(rows, locale, target),
    )

    if (item) {
      references.push({
        field: 'items',
        id: taskList.id,
        itemIndex: item.itemIndex,
        locale: item.locale,
        name,
        path: item.path,
        referenceType: 'richtext',
      })
    }
  }

  return references
}

/**
 * Check if a document ID is referenced in a rich text field
 * Searches for link nodes with document references (Lexical editor format)
 */
function isDocumentReferencedInRichText(
  richText: unknown,
  documentId: number,
  collectionSlug: string,
): boolean {
  if (!isRecord(richText) || !richText.root) return false

  // Recursively search through the rich text structure
  function searchNode(node: unknown): boolean {
    // A block node keeps its rows in an array under `fields`, and a row may hold rich text.
    if (isArray(node)) {
      return node.some((child) => searchNode(child))
    }

    if (!isRecord(node)) return false

    // Check if this is a link node with a document reference (Lexical format)
    if (node.type === 'link') {
      const linkFields = node.fields
      if (isRecord(linkFields)) {
        const linkedDoc = linkFields.doc
        if (isRecord(linkedDoc) && linkedDoc.relationTo === collectionSlug) {
          const linkedValue = linkedDoc.value
          if (isRecord(linkedValue) && linkedValue.id === documentId) {
            return true
          }
        }
      }
    }
    // Check if this is a relationship node pointing to our document (older format)
    // `else if` and a second `if` behave the same: `type` is never 'link' and 'relationship'.
    else if (node.type === 'relationship' || node.type === 'upload') {
      const nodeValue = node.value
      if (
        node.relationTo === collectionSlug &&
        isRecord(nodeValue) &&
        nodeValue.id === documentId
      ) {
        return true
      }
      // Also check if value is directly the ID (some formats store it differently)
      if (node.relationTo === collectionSlug && nodeValue === documentId) {
        return true
      }
    }

    // Check children nodes
    const children = node.children
    if (children && isArray(children)) {
      for (const child of children) {
        if (searchNode(child)) return true
      }
    }

    // Check any other properties that might contain nodes
    for (const key in node) {
      if (key !== 'children' && typeof node[key] === 'object' && searchNode(node[key])) return true
    }

    return false
  }

  return searchNode(richText.root)
}

/** A read with `locale: 'all'` answers a localized `name` as an object keyed by locale. */
function nameOf(name: unknown, locales: string[], fallback: string): string {
  return getLocalizedValue(name, locales) || fallback
}

/** Whether a description, a block or an item of the row references the document. */
function referencesDocumentInContent(row: unknown, target: ScanTarget): boolean {
  if (!isRecord(row)) return false

  return ['blocks', 'description', 'items'].some((field) =>
    checkForDocumentReference(row[field], target.documentId, target.collectionSlug),
  )
}

/**
 * A read by a member who is not an admin of the organisation arrives without `organisation`,
 * because `organisationAdminFieldAccess` strips the field first. That member can only read a
 * document of the selected organisation, so the caller's access names the same rows.
 */
function resolveScanScope(organisation: unknown): ScanScope {
  const organisationId = getIdFromRelation(organisation)

  if (organisationId === null) {
    return { disableErrors: true, overrideAccess: false, partial: true }
  }

  return {
    disableErrors: false,
    overrideAccess: true,
    partial: false,
    where: { organisation: { equals: organisationId } },
  }
}

/** Joins a clause with the scope, so a scoped read never widens past its organisation. */
function scopedWhere(scope: ScanScope, where: Where): Where {
  return scope.where ? { and: [scope.where, where] } : where
}

/**
 * Runs `search` over an array field. A read with `locale: 'all'` answers a localized array as an
 * object keyed by locale, and a plain array otherwise. The first locale with a hit wins.
 */
function searchLocalizedRows<TResult>(
  rows: unknown,
  locales: string[],
  search: (rows: unknown[], locale?: string) => null | TResult,
): null | TResult {
  if (isArray(rows)) {
    return search(rows)
  }

  if (!isRecord(rows)) {
    return null
  }

  for (const locale of locales) {
    const localeRows = rows[locale]

    if (!isArray(localeRows)) {
      continue
    }

    const result = search(localeRows, locale)

    if (result) {
      return result
    }
  }

  return null
}
