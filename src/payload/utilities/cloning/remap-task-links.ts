import { PayloadRequest, TypedLocale } from 'payload'

import { isRecord, isUnknownArray } from '@/payload/assertions'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'
import { degradeLinkToText } from '@/payload/utilities/cloning/process-rich-text'

/** Answers the clone of a source task, or undefined when this run did not copy it. */
export type ClonedTaskLookup = (collection: TaskCollection, sourceId: number) => number | undefined

export interface CloneRecordRef {
  collection: 'activities' | TaskCollection
  id: number
}

export interface RemapTaskLinkTotals {
  degraded: number
  remapped: number
}

export type TaskCollection = 'task-flows' | 'task-lists'

interface RemapTaskLinksArgs {
  cloneLocales: TypedLocale[]
  lookupClonedTask: ClonedTaskLookup
  records: CloneRecordRef[]
  req: PayloadRequest
  targetOrgId: number
}

// `files` rows are shared by every locale, and a write without their ids replaces them all.
// See .claude/rules/project/decisions/clone-files-rows-keep-one-id-across-locales.md
const NEVER_WRITE_BACK = new Set(['createdAt', 'files', 'id', 'organisation', 'updatedAt'])

/**
 * Points every rich text link at the clone of the task it names, and degrades the rest to text.
 *
 * This runs after the whole batch, never during a clone. Two task flows often link each other,
 * so a link cannot wait for the clone of its target without a deadlock.
 */
export const remapTaskLinks = async ({
  cloneLocales,
  lookupClonedTask,
  records,
  req,
  targetOrgId,
}: RemapTaskLinksArgs): Promise<RemapTaskLinkTotals> => {
  const totals: RemapTaskLinkTotals = { degraded: 0, remapped: 0 }

  for (const record of records) {
    for (const locale of cloneLocales) {
      // `false` is the only value that turns the fallback off. `null` turns it on.
      // See .claude/rules/project/pitfalls/fallback-locale-null-enables-the-fallback.md
      // The clone lives in the target park, which is rarely the caller's selected one. A read
      // without the override answers 404 there. See
      // .claude/rules/project/pitfalls/cross-tenant-reads-need-override-access.md
      const stored = await req.payload.findByID({
        collection: record.collection,
        depth: 0,
        fallbackLocale: false,
        id: record.id,
        locale,
        overrideAccess: true,
        req,
      })

      const data: Record<string, unknown> = {}
      const counters: RemapTaskLinkTotals = { degraded: 0, remapped: 0 }

      for (const [field, value] of Object.entries(stored)) {
        if (NEVER_WRITE_BACK.has(field) || !(isRecord(value) || isUnknownArray(value))) {
          continue
        }

        const before = counters.degraded + counters.remapped
        const remapped = remapValue(value, lookupClonedTask, counters)

        if (counters.degraded + counters.remapped > before) {
          data[field] = remapped
        }
      }

      if (Object.keys(data).length === 0) {
        continue
      }

      await req.payload.update({
        collection: record.collection,
        data,
        id: record.id,
        locale,
        overrideAccess: true,
        req: mergeReqContextTargetOrgId(req, targetOrgId),
      })

      totals.degraded += counters.degraded
      totals.remapped += counters.remapped
    }
  }

  return totals
}

interface TaskLinkTarget {
  collection: TaskCollection
  doc: Record<string, unknown>
  sourceId: number
}

/**
 * Rebuilds the node tree with every task link resolved.
 *
 * A link to a document is already correct, because `processRichTextField` repointed it during
 * the clone. A link to a public document stays on the shared original by design.
 */
const remapValue = (
  value: unknown,
  lookupClonedTask: ClonedTaskLookup,
  counters: RemapTaskLinkTotals,
): unknown => {
  if (isUnknownArray(value)) {
    return value.map((entry) => remapValue(entry, lookupClonedTask, counters))
  }

  if (!isRecord(value)) {
    return value
  }

  const target = readTaskLinkTarget(value)

  if (target) {
    const clonedId = lookupClonedTask(target.collection, target.sourceId)

    if (clonedId === undefined) {
      counters.degraded++
      return degradeLinkToText(value)
    }

    counters.remapped++

    return {
      ...value,
      fields: { ...(value.fields as Record<string, unknown>), doc: { ...target.doc, value: clonedId } },
    }
  }

  const next: Record<string, unknown> = {}

  for (const [key, entry] of Object.entries(value)) {
    next[key] = remapValue(entry, lookupClonedTask, counters)
  }

  return next
}

/** Reads the task a lexical link names. Every other link node answers undefined. */
const readTaskLinkTarget = (node: Record<string, unknown>): TaskLinkTarget | undefined => {
  if (node.type !== 'link' || !isRecord(node.fields) || !isRecord(node.fields.doc)) {
    return undefined
  }

  const doc = node.fields.doc

  if (doc.relationTo !== 'task-flows' && doc.relationTo !== 'task-lists') {
    return undefined
  }

  // A stored link carries the raw id. A populated read carries the whole task.
  const sourceId = isRecord(doc.value) ? doc.value.id : doc.value

  if (typeof sourceId !== 'number') {
    return undefined
  }

  return { collection: doc.relationTo, doc, sourceId }
}
