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

/** One task whose link the clone dropped, for the report. */
export interface DroppedTaskLink {
  collection: TaskCollection
  name: string
  sourceId: number
}

export interface RemapTaskLinkTotals {
  /** Links replaced by text, because the target park does not hold the task. */
  degraded: number
  dropped: DroppedTaskLink[]
  /** Links left alone, because the target park already holds the task. */
  kept: number
  /** Links pointed at the copy this run made. */
  remapped: number
}

export type TaskCollection = 'task-flows' | 'task-lists'

/** What one link must become. A number is the id to point at. */
type LinkDecision = 'degrade' | 'keep' | number

interface RemapTaskLinksArgs {
  cloneLocales: TypedLocale[]
  lookupClonedTask: ClonedTaskLookup
  records: CloneRecordRef[]
  req: PayloadRequest
  targetOrgId: number
}

interface TaskLinkTarget {
  collection: TaskCollection
  doc: Record<string, unknown>
  sourceId: number
}

// `files` rows are shared by every locale, and a write without their ids replaces them all.
// See .claude/rules/project/decisions/clone-files-rows-keep-one-id-across-locales.md
const NEVER_WRITE_BACK = new Set(['createdAt', 'files', 'id', 'organisation', 'updatedAt'])

/**
 * Resolves every rich text link that names a task flow or a task list.
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
  const totals: RemapTaskLinkTotals = { degraded: 0, dropped: [], kept: 0, remapped: 0 }
  const decisions = new Map<string, LinkDecision>()

  for (const record of records) {
    for (const locale of cloneLocales) {
      // `false` is the only value that turns the fallback off. `null` turns it on. See
      // .claude/rules/project/pitfalls/fallback-locale-null-enables-the-fallback.md
      // The clone lives in the target park, which is rarely the caller's selected one, so the
      // read needs the override. See
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

      const fields = Object.entries(stored).filter(
        ([field, value]) =>
          !NEVER_WRITE_BACK.has(field) && (isRecord(value) || isUnknownArray(value)),
      )

      await decideEveryTarget({ decisions, fields, lookupClonedTask, req, targetOrgId, totals })

      const data: Record<string, unknown> = {}
      let changed = 0

      for (const [field, value] of fields) {
        const counters = { changed: 0 }
        const remapped = applyDecisions(value, decisions, counters)

        if (counters.changed > 0) {
          data[field] = remapped
          changed += counters.changed
        }
      }

      if (changed === 0) {
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
    }
  }

  return totals
}

/**
 * Rebuilds the node tree with each task link resolved.
 *
 * A link to a document is already correct, because `processRichTextField` repointed it during the
 * clone. A link to a public document stays on the shared original by design.
 */
const applyDecisions = (
  value: unknown,
  decisions: Map<string, LinkDecision>,
  counters: { changed: number },
): unknown => {
  if (isUnknownArray(value)) {
    return value.map((entry) => applyDecisions(entry, decisions, counters))
  }

  if (!isRecord(value)) {
    return value
  }

  const target = readTaskLinkTarget(value)

  if (target) {
    const decision = decisions.get(targetKey(target))

    if (decision === 'degrade') {
      counters.changed++
      return degradeLinkToText(value)
    }

    if (typeof decision === 'number') {
      counters.changed++

      return {
        ...value,
        fields: {
          ...(value.fields as Record<string, unknown>),
          doc: { ...target.doc, value: decision },
        },
      }
    }

    return value
  }

  const next: Record<string, unknown> = {}

  for (const [key, entry] of Object.entries(value)) {
    next[key] = applyDecisions(entry, decisions, counters)
  }

  return next
}

/** Collects every task link of one record, so each target is decided once. */
const collectTargets = (value: unknown, found: Map<string, TaskLinkTarget>): void => {
  if (isUnknownArray(value)) {
    for (const entry of value) collectTargets(entry, found)
    return
  }

  if (!isRecord(value)) {
    return
  }

  const target = readTaskLinkTarget(value)

  if (target) {
    found.set(targetKey(target), target)
    return
  }

  for (const entry of Object.values(value)) collectTargets(entry, found)
}

/**
 * Decides each target once per run, and counts the decision once.
 *
 * A task the run copied answers the copy. A task the target park already owns keeps its link,
 * because that link is valid there. Every other task leaves the park, so its link becomes text.
 */
const decideEveryTarget = async ({
  decisions,
  fields,
  lookupClonedTask,
  req,
  targetOrgId,
  totals,
}: {
  decisions: Map<string, LinkDecision>
  fields: Array<[string, unknown]>
  lookupClonedTask: ClonedTaskLookup
  req: PayloadRequest
  targetOrgId: number
  totals: RemapTaskLinkTotals
}): Promise<void> => {
  const found = new Map<string, TaskLinkTarget>()

  for (const [, value] of fields) collectTargets(value, found)

  for (const [key, target] of found) {
    if (decisions.has(key)) {
      continue
    }

    const clonedId = lookupClonedTask(target.collection, target.sourceId)

    if (clonedId !== undefined) {
      decisions.set(key, clonedId)
      totals.remapped++
      continue
    }

    const owner = await readTaskOwner(req, target)

    if (owner.organisationId === targetOrgId) {
      decisions.set(key, 'keep')
      totals.kept++
      continue
    }

    decisions.set(key, 'degrade')
    totals.degraded++
    totals.dropped.push({
      collection: target.collection,
      name: owner.name,
      sourceId: target.sourceId,
    })
  }
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

/**
 * Answers which park owns the task a link names, and how the report should name it.
 *
 * The read needs the override, because an access-checked read strips `organisation`. See
 * .claude/rules/project/pitfalls/organisation-field-is-stripped-from-an-access-checked-read.md
 * A task that no longer exists belongs to no park, so its link becomes text.
 */
const readTaskOwner = async (
  req: PayloadRequest,
  target: TaskLinkTarget,
): Promise<{ name: string; organisationId: null | number }> => {
  try {
    const task = await req.payload.findByID({
      collection: target.collection,
      depth: 0,
      id: target.sourceId,
      overrideAccess: true,
      req,
    })

    const organisation = task.organisation
    const organisationId = isRecord(organisation) ? organisation.id : organisation

    return {
      name: typeof task.name === 'string' ? task.name : String(target.sourceId),
      organisationId: typeof organisationId === 'number' ? organisationId : null,
    }
  } catch {
    return { name: String(target.sourceId), organisationId: null }
  }
}

const targetKey = (target: TaskLinkTarget): string => `${target.collection}:${target.sourceId}`
