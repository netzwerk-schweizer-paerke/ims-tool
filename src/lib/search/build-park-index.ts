import { joinSearchText, toSearchText } from '@/lib/search/to-search-text'
import { ParkSearchHit } from '@/lib/search/types'
import { Activity, Document as DocumentRecord, TaskFlow, TaskList } from '@/payload-types'

/**
 * Only the fields the index reads. A `find` result satisfies each one, and a test fixture then
 * needs four keys rather than a whole generated document.
 */
type ActivityInput = Pick<Activity, 'blocks' | 'description' | 'id' | 'name'>

type Args = {
  activities: ActivityInput[]
  /** The name of the record that uses a document, keyed by document id. */
  documentParents?: Map<number, string>
  documents: DocumentInput[]
  taskFlows: TaskFlowInput[]
  taskLists: TaskListInput[]
}

type DocumentInput = Pick<DocumentRecord, 'description' | 'filename' | 'id' | 'name'>

type TaskFlowInput = Pick<TaskFlow, 'blocks' | 'description' | 'id' | 'name'>

type TaskListInput = Pick<TaskList, 'description' | 'id' | 'items' | 'name'>

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * A record with no name in the requested locale answers `name: undefined`, because the fallback
 * locale holds no row either. The generated type says `string`, so nothing catches it.
 */
const asText = (value: null | string | undefined): string => value ?? ''

/** A label spans several lines inside its shape. One line reads better in a result list. */
const oneLine = (text: string): string => text.replaceAll(/\s+/g, ' ').trim()

/** The longest title a result row shows. A longer one is body text, not a name. */
const TITLE_LIMIT = 80

/**
 * The epoch prefix an upload puts before the name a person chose, such as `1758561309880-`. A
 * clone re-uploads the file and adds a second one. The leading 1 keeps the pattern off a plain
 * 13-digit number, such as a GTIN. Measured on 2026-09-05: 519 of 1533 names carry one to three.
 */
const UPLOAD_PREFIX = /^(1\d{12}-)+/

/**
 * The opening sentence of a rich text field, as a title.
 *
 * A task list item stores a whole paragraph in `topic`. The full text stays in the hit body, so
 * the search still finds every word of it.
 */
const asTitle = (text: string): string => {
  const line = oneLine(text.split(/[.\n]/, 1)[0])

  return line.length > TITLE_LIMIT ? `${line.slice(0, TITLE_LIMIT).trimEnd()}…` : line
}

/**
 * The visible label of a block. Each block type keeps its own keys under `graph`, such as
 * `task`, `io`, `output` and `test`, so this reads every value rather than a named one.
 */
const graphText = (block: unknown): string => {
  if (!isRecord(block) || !isRecord(block.graph)) {
    return ''
  }

  return oneLine(joinSearchText(Object.values(block.graph)))
}

/** The rich text a block carries beside its label, across both collections' block types. */
const blockBodyText = (block: unknown): string => {
  if (!isRecord(block)) {
    return ''
  }

  const groups = ['infos', 'io', 'keypoints', 'responsibility', 'tools']

  return joinSearchText(
    groups.flatMap((group) => (isRecord(block[group]) ? Object.values(block[group]) : [])),
  )
}

/**
 * Turns one park into the flat list the search filters.
 *
 * A hit exists only where a route can reach it. A flow block and a list item therefore fold into
 * the page that renders them, because neither has a route of its own.
 */
export const buildParkIndex = ({
  activities,
  documentParents,
  documents,
  taskFlows,
  taskLists,
}: Args): ParkSearchHit[] => {
  const hits: ParkSearchHit[] = []

  for (const activity of activities) {
    const name = asText(activity.name)

    hits.push({
      context: '',
      target: { activityId: activity.id, kind: 'activity' },
      text: toSearchText(activity.description),
      title: name,
    })

    for (const block of activity.blocks ?? []) {
      // A block with no id has no route. See `block-id-is-per-locale` for why the id is
      // read under one locale only.
      if (!block.id) {
        continue
      }

      hits.push({
        context: name,
        target: { activityId: activity.id, blockId: block.id, kind: 'block' },
        text: blockBodyText(block),
        title: graphText(block),
      })
    }
  }

  for (const flow of taskFlows) {
    hits.push({
      context: '',
      target: { flowId: flow.id, kind: 'flow' },
      text: joinSearchText([
        flow.description,
        ...(flow.blocks ?? []).map((block) => `${graphText(block)} ${blockBodyText(block)}`),
      ]),
      title: asText(flow.name),
    })
  }

  for (const list of taskLists) {
    const name = asText(list.name)

    hits.push({
      context: '',
      target: { kind: 'list', listId: list.id },
      text: toSearchText(list.description),
      title: name,
    })

    for (const item of list.items ?? []) {
      const topic = toSearchText(item.topic)

      hits.push({
        context: name,
        target: { kind: 'listItem', listId: list.id },
        // The whole topic stays in the body, so a word past the title still matches.
        text: joinSearchText([topic, item.tools, item.responsibility]),
        title: asTitle(topic),
      })
    }
  }

  for (const document of documents) {
    // The prefix carries no meaning for a reader, and it makes every upload sort by its date.
    const filename = asText(document.filename).replace(UPLOAD_PREFIX, '')

    hits.push({
      context: documentParents?.get(document.id) ?? '',
      target: { documentId: document.id, kind: 'document' },
      text: joinSearchText([document.description, filename]),
      title: asText(document.name) || filename,
    })
  }

  return hits
}
