/** The collection the search indexes. A `documents-public` reference names another one. */
const DOCUMENTS = 'documents'

type Args = {
  activities: ParentInput[]
  taskFlows: ParentInput[]
  taskLists: ParentInput[]
}

/**
 * Only the fields that can hold a document reference, plus the name a result row shows.
 *
 * Each one is `unknown`, because the walk below reads a shape rather than a field. The generated
 * type of a block is a union of every block type, and none of that helps a recursive walk.
 */
type ParentInput = {
  blocks?: unknown
  description?: unknown
  files?: unknown
  items?: unknown
  name?: null | string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** The endpoint reads at depth 0, so a reference is a bare id. A populated row carries `id`. */
const idOf = (value: unknown): null | number => {
  if (typeof value === 'number') {
    return value
  }

  return isRecord(value) && typeof value.id === 'number' ? value.id : null
}

const addId = (into: Set<number>, value: unknown): void => {
  const id = idOf(value)

  if (id !== null) {
    into.add(id)
  }
}

/**
 * Every `documents` id one value references, at any depth.
 *
 * A reference takes three shapes. A Lexical link node holds `fields.doc`. A relationship node and
 * an upload node name the collection beside the value. A `files` row holds a plain relation, with
 * no collection name of its own, because that field points at `documents` alone.
 */
const collectIds = (value: unknown, into: Set<number>): void => {
  if (Array.isArray(value)) {
    for (const entry of value) {
      collectIds(entry, into)
    }

    return
  }

  if (!isRecord(value)) {
    return
  }

  if (
    isRecord(value.fields) &&
    isRecord(value.fields.doc) &&
    value.fields.doc.relationTo === DOCUMENTS
  ) {
    addId(into, value.fields.doc.value)
  }

  if (value.relationTo === DOCUMENTS) {
    addId(into, value.value)
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === 'files' && Array.isArray(child)) {
      for (const row of child) {
        if (isRecord(row)) {
          addId(into, row.document)
        }
      }

      continue
    }

    collectIds(child, into)
  }
}

/**
 * The name of the record that uses a document, keyed by document id.
 *
 * The endpoint already holds every activity, flow and list, so this walks what it read.
 * `addUsageInfoAfterReadHook` costs three queries per document instead.
 *
 * The first record that references a document names it, because a result row shows one line.
 */
export const collectDocumentParents = ({
  activities,
  taskFlows,
  taskLists,
}: Args): Map<number, string> => {
  const parents = new Map<number, string>()

  for (const record of [...activities, ...taskFlows, ...taskLists]) {
    const name = record.name ?? ''

    if (name.length === 0) {
      continue
    }

    const ids = new Set<number>()

    // The wrapper gives the `files` array of the record the same walk as a nested one.
    collectIds(
      {
        blocks: record.blocks,
        description: record.description,
        files: record.files,
        items: record.items,
      },
      ids,
    )

    for (const id of ids) {
      if (!parents.has(id)) {
        parents.set(id, name)
      }
    }
  }

  return parents
}
