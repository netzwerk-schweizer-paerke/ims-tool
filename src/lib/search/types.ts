/** One searchable record of a park. */
export type ParkSearchHit = {
  /** The parent that places the hit, such as the activity a block belongs to. */
  context: string
  target: ParkSearchTarget
  /** The body the matcher searches after the title. */
  text: string
  title: string
}

/** The answer of `GET /api/park-search`. */
export type ParkSearchIndex = {
  hits: ParkSearchHit[]
  /** The content locale the hits were read under. A block id belongs to one locale. */
  locale: string
}

export type ParkSearchKind = ParkSearchTarget['kind']

/**
 * Where a hit sends the reader. It carries the route parts, never a finished URL, because the
 * base path differs between the admin view and a public share page. See
 * `view-links-prop-carries-the-link-base-path`.
 */
export type ParkSearchTarget =
  | { activityId: number; blockId: string; kind: 'block' }
  | { activityId: number; kind: 'activity' }
  | { documentId: number; kind: 'document' }
  | { flowId: number; kind: 'flow' }
  | { kind: 'list'; listId: number }
  | { kind: 'listItem'; listId: number }
