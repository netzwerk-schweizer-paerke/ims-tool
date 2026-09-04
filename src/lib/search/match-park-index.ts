import { foldSearchText, plainSearchText } from '@/lib/search/fold-search-text'
import {
  ParkSearchHit,
  ParkSearchKind,
  ParkSearchMatch,
  ParkSearchTarget,
} from '@/lib/search/types'

/** Where the word matched. A title match says far more than a body match. */
const TITLE_SCORE = 6
const CONTEXT_SCORE = 3
const BODY_SCORE = 1

/** A title that opens with the word beats a title that holds it in the middle. */
const TITLE_PREFIX_BONUS = 4
const TITLE_WORD_START_BONUS = 2

/**
 * The longest title that still counts as a name. A task list item takes its title from a
 * paragraph, and a paragraph holds many words, so it would collect a word-start bonus it has
 * not earned. Above this length the title scores like a name, and it earns no bonus.
 */
const NAME_LIMIT = 60

/** The characters the snippet keeps before and after the matched word. */
const SNIPPET_BEFORE = 30
const SNIPPET_AFTER = 70

/**
 * A tie-break only. A page a person navigates to outranks a file, and a list item sits below its
 * own list. The values stay under `TITLE_SCORE`, so a kind never beats a better field match.
 */
const KIND_WEIGHTS: Record<ParkSearchKind, number> = {
  activity: 2,
  block: 2,
  document: 0,
  flow: 2,
  list: 2,
  listItem: 1,
}

/** One hit under both folds. The accent fold keeps the length, so it locates the snippet. */
type Folded = {
  body: string
  bodyPlain: string
  context: string
  title: string
}

/** The hits that open one page, with the best-scoring one at the front. */
type Group = {
  count: number
  hit: ParkSearchHit
  scored: Scored
}

/** One word of the query, under both folds. */
type QueryWord = {
  folded: string
  plain: string
}

type Scored = {
  /** `true` when the title or the body holds a word, rather than the context alone. */
  own: boolean
  score: number
  /** The first word that only the body holds. It places the snippet. */
  snippetWord: null | QueryWord
}

type WordScore = {
  field: 'body' | 'context' | 'title'
  score: number
}

/**
 * The fold costs one pass over every string of the park, and the hits never change between two
 * keystrokes. A weak map therefore folds each hit once, and holds it no longer than the hit.
 */
const foldCache = new WeakMap<ParkSearchHit, Folded>()

const foldedOf = (hit: ParkSearchHit): Folded => {
  const cached = foldCache.get(hit)

  if (cached) {
    return cached
  }

  const folded: Folded = {
    body: foldSearchText(hit.text),
    bodyPlain: plainSearchText(hit.text),
    context: foldSearchText(hit.context),
    title: foldSearchText(hit.title),
  }

  foldCache.set(hit, folded)

  return folded
}

/** Whether the word starts a word in the text, rather than sitting inside one. */
const startsAWord = (text: string, word: string): boolean => {
  let from = 0

  while (from <= text.length - word.length) {
    const at = text.indexOf(word, from)

    if (at === -1) {
      return false
    }

    if (at === 0 || !/[\p{L}\p{N}]/u.test(text[at - 1])) {
      return true
    }

    from = at + 1
  }

  return false
}

const titleScore = (title: string, word: string): number => {
  if (title.length > NAME_LIMIT) {
    return TITLE_SCORE
  }

  if (title.startsWith(word)) {
    return TITLE_SCORE + TITLE_PREFIX_BONUS
  }

  return startsAWord(title, word) ? TITLE_SCORE + TITLE_WORD_START_BONUS : TITLE_SCORE
}

/** The score of one word against one hit, or null when the hit does not hold the word at all. */
const scoreWord = (fields: Folded, word: string): null | WordScore => {
  if (fields.title.includes(word)) {
    return { field: 'title', score: titleScore(fields.title, word) }
  }

  if (fields.context.includes(word)) {
    return { field: 'context', score: CONTEXT_SCORE }
  }

  return fields.body.includes(word) ? { field: 'body', score: BODY_SCORE } : null
}

const scoreHit = (hit: ParkSearchHit, words: QueryWord[]): null | Scored => {
  const fields = foldedOf(hit)
  let own = false
  let score = KIND_WEIGHTS[hit.target.kind]
  let snippetWord: null | QueryWord = null

  for (const word of words) {
    const match = scoreWord(fields, word.folded)

    // Every word must appear somewhere, which matches Payload's own `like` operator.
    if (match === null) {
      return null
    }

    score += match.score

    if (match.field !== 'context') {
      own = true
    }

    if (match.field === 'body' && snippetWord === null) {
      snippetWord = word
    }
  }

  return { own, score, snippetWord }
}

/**
 * The body text around the matched word, so a row that matched in the body says why.
 *
 * The German fold changes the length, so its offset names no character of the source. The accent
 * fold keeps the length. A word that only the German fold reaches falls back to the body opening.
 */
const snippetOf = (hit: ParkSearchHit, fields: Folded, word: QueryWord): string => {
  const text = typeof hit.text === 'string' ? hit.text : ''
  const mapped = fields.bodyPlain.length === text.length
  const at = mapped ? fields.bodyPlain.indexOf(word.plain) : -1
  const from = at === -1 ? 0 : Math.max(0, at - SNIPPET_BEFORE)
  const to = Math.min(text.length, from + SNIPPET_BEFORE + SNIPPET_AFTER)

  return `${from > 0 ? '…' : ''}${text.slice(from, to).trim()}${to < text.length ? '…' : ''}`
}

/** The page a hit opens. Several list items share one, because a list item has no own route. */
const targetKey = (target: ParkSearchTarget): string => {
  switch (target.kind) {
    case 'activity': {
      return `activity:${target.activityId}`
    }
    case 'block': {
      return `block:${target.activityId}:${target.blockId}`
    }
    case 'document': {
      return `document:${target.documentId}`
    }
    case 'flow': {
      return `flow:${target.flowId}`
    }
    case 'list':
    case 'listItem': {
      return `list:${target.listId}`
    }
  }
}

const toQueryWords = (query: string): QueryWord[] =>
  query
    .split(/\s+/)
    .map((word) => ({ folded: foldSearchText(word), plain: plainSearchText(word) }))
    .filter((word) => word.folded.length > 0)

/**
 * Filters the park index by a keyword query, and ranks what matched.
 *
 * A word matches a part of a word, so `plan` finds `Mehrjahresplanung`. Every word must appear,
 * in any order. The score weights the title above the context, and the context above the body.
 *
 * Every hit that opens one page becomes one row. A task list is the only kind that groups, and
 * `count` then names the items that hold the words.
 */
export const matchParkIndex = (hits: ParkSearchHit[], query: string): ParkSearchMatch[] => {
  const words = toQueryWords(query)

  if (words.length === 0) {
    return []
  }

  const groups = new Map<string, Group>()
  // The array holds the same objects as the map. `Iterator.prototype.toArray` would need
  // Safari 18.4, and this project sets no browserslist, so Next targets an older baseline.
  const order: Group[] = []

  for (const hit of hits) {
    const scored = scoreHit(hit, words)

    if (scored === null) {
      continue
    }

    const key = targetKey(hit.target)
    const group = groups.get(key)

    if (!group) {
      const created: Group = { count: scored.own ? 1 : 0, hit, scored }

      groups.set(key, created)
      order.push(created)
      continue
    }

    if (scored.own) {
      group.count += 1
    }

    if (scored.score > group.scored.score) {
      group.hit = hit
      group.scored = scored
    }
  }

  return order
    .sort(
      (a, b) =>
        b.scored.score - a.scored.score ||
        foldedOf(a.hit).title.localeCompare(foldedOf(b.hit).title),
    )
    .map((group) => ({
      // A group that matched through the context of every member still names one page.
      count: Math.max(1, group.count),
      hit: group.hit,
      snippet: group.scored.snippetWord
        ? snippetOf(group.hit, foldedOf(group.hit), group.scored.snippetWord)
        : '',
    }))
}
