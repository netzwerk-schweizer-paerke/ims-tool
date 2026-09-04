import { ParkSearchHit, ParkSearchKind } from '@/lib/search/types'

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

type Fields = {
  body: string
  context: string
  title: string
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

/** The score of one word against one hit, or null when the hit does not hold the word at all. */
const scoreWord = (fields: Fields, word: string): null | number => {
  if (fields.title.includes(word)) {
    if (fields.title.length > NAME_LIMIT) {
      return TITLE_SCORE
    }

    if (fields.title.startsWith(word)) {
      return TITLE_SCORE + TITLE_PREFIX_BONUS
    }

    return startsAWord(fields.title, word) ? TITLE_SCORE + TITLE_WORD_START_BONUS : TITLE_SCORE
  }

  if (fields.context.includes(word)) {
    return CONTEXT_SCORE
  }

  return fields.body.includes(word) ? BODY_SCORE : null
}

/** The hits arrive over the network, so a missing string must not throw during render. */
const lower = (value: unknown): string => (typeof value === 'string' ? value.toLowerCase() : '')

const scoreHit = (hit: ParkSearchHit, words: string[]): null | number => {
  const fields: Fields = {
    body: lower(hit.text),
    context: lower(hit.context),
    title: lower(hit.title),
  }

  let total = KIND_WEIGHTS[hit.target.kind]

  for (const word of words) {
    const score = scoreWord(fields, word)

    // Every word must appear somewhere, which matches Payload's own `like` operator.
    if (score === null) {
      return null
    }

    total += score
  }

  return total
}

/**
 * Filters the park index by a keyword query, and ranks what matched.
 *
 * A word matches a part of a word, so `plan` finds `Mehrjahresplanung`. Every word must appear,
 * in any order. The score weights the title above the context, and the context above the body.
 */
export const matchParkIndex = (hits: ParkSearchHit[], query: string): ParkSearchHit[] => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return []
  }

  const scored: { hit: ParkSearchHit; score: number }[] = []

  for (const hit of hits) {
    const score = scoreHit(hit, words)

    if (score !== null) {
      scored.push({ hit, score })
    }
  }

  scored.sort((a, b) => b.score - a.score || lower(a.hit.title).localeCompare(lower(b.hit.title)))

  return scored.map((entry) => entry.hit)
}
