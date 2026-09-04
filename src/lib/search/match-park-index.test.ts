import { describe, expect, test } from 'vitest'

import { matchParkIndex } from '@/lib/search/match-park-index'
import { ParkSearchHit, ParkSearchMatch, ParkSearchTarget } from '@/lib/search/types'

const FLOW: ParkSearchTarget = { flowId: 1, kind: 'flow' }
const DOCUMENT: ParkSearchTarget = { documentId: 1, kind: 'document' }

const hit = (
  title: string,
  text = '',
  context = '',
  target: ParkSearchTarget = FLOW,
): ParkSearchHit => ({ context, target, text, title })

const listItem = (title: string, text = '', context = '', listId = 5): ParkSearchHit =>
  hit(title, text, context, { kind: 'listItem', listId })

const titles = (matches: ParkSearchMatch[]) => matches.map((entry) => entry.hit.title)

describe('matchParkIndex', () => {
  test('returns nothing for an empty query', () => {
    expect(matchParkIndex([hit('Mehrjahresplanung')], '')).toEqual([])
    expect(matchParkIndex([hit('Mehrjahresplanung')], ' '.repeat(3))).toEqual([])
  })

  test('matches a part of a word, and ignores the case', () => {
    expect(titles(matchParkIndex([hit('Mehrjahresplanung')], 'PLAN'))).toEqual([
      'Mehrjahresplanung',
    ])
  })

  test('requires every word, in any order', () => {
    const hits = [hit('Charta Teil A'), hit('Charta', '', '', { flowId: 2, kind: 'flow' })]

    expect(titles(matchParkIndex(hits, 'teil charta'))).toEqual(['Charta Teil A'])
  })

  test('drops a hit that holds no field with the word', () => {
    expect(matchParkIndex([hit('Charta', 'Teil A', 'Führung')], 'budget')).toEqual([])
  })
})

describe('matchParkIndex folding', () => {
  test('finds an accented title from a query without the accent', () => {
    expect(titles(matchParkIndex([hit('Évaluation générale')], 'evaluation'))).toEqual([
      'Évaluation générale',
    ])
  })

  test('finds a transliterated file name from a query with the umlaut', () => {
    const hits = [hit('510_V_Stolperunfaelle-4.pdf', '', '', DOCUMENT)]

    expect(titles(matchParkIndex(hits, 'Stolperunfälle'))).toEqual(['510_V_Stolperunfaelle-4.pdf'])
  })

  test('finds an umlaut title from a query written with the transliteration', () => {
    expect(titles(matchParkIndex([hit('Übersicht Datenbanken')], 'uebersicht'))).toEqual([
      'Übersicht Datenbanken',
    ])
  })
})

describe('matchParkIndex weighting', () => {
  test('ranks the title above the context, and the context above the body', () => {
    const hits = [
      hit('Zusammenarbeit', 'Die Charta nennt es', '', { flowId: 1, kind: 'flow' }),
      hit('Kooperation', '', 'Charta und Ziele', { flowId: 2, kind: 'flow' }),
      hit('Interne Charta', '', '', { flowId: 3, kind: 'flow' }),
    ]

    expect(titles(matchParkIndex(hits, 'charta'))).toEqual([
      'Interne Charta',
      'Kooperation',
      'Zusammenarbeit',
    ])
  })

  test('ranks a title prefix above a word start, and a word start above a mid-word match', () => {
    const hits = [
      hit('Personalplanung', '', '', { flowId: 1, kind: 'flow' }),
      hit('Interne Planung', '', '', { flowId: 2, kind: 'flow' }),
      hit('Planung 2026', '', '', { flowId: 3, kind: 'flow' }),
    ]

    expect(titles(matchParkIndex(hits, 'planung'))).toEqual([
      'Planung 2026',
      'Interne Planung',
      'Personalplanung',
    ])
  })

  test('breaks a tie by kind, so a document sits below a page', () => {
    const hits = [hit('Charta', '', '', DOCUMENT), hit('Charta', '', '', FLOW)]

    expect(matchParkIndex(hits, 'charta')[0].hit.target.kind).toBe('flow')
  })

  test('a kind weight never outranks a better field match', () => {
    const hits = [
      hit('Charta 2026', '', '', DOCUMENT),
      hit('Anhang', 'Die Charta liegt bei', '', FLOW),
    ]

    expect(titles(matchParkIndex(hits, 'charta'))).toEqual(['Charta 2026', 'Anhang'])
  })

  test('sums the score over every word', () => {
    const hits = [
      hit('Charta Teil A', '', '', { flowId: 1, kind: 'flow' }),
      hit('Charta', 'Teil A', '', { flowId: 2, kind: 'flow' }),
    ]

    expect(titles(matchParkIndex(hits, 'charta teil'))).toEqual(['Charta Teil A', 'Charta'])
  })

  test('gives a paragraph title no word-start bonus, so a real name outranks it', () => {
    const paragraph = `Saisonplanung mit dem Forstdienst ${'und weiteren Beteiligten '.repeat(2)}`
    const hits = [
      hit(paragraph.slice(0, 80), '', '', { flowId: 1, kind: 'flow' }),
      hit('101 Mehrjahresplanung', '', '', { flowId: 2, kind: 'flow' }),
    ]

    expect(titles(matchParkIndex(hits, 'planung'))[0]).toBe('101 Mehrjahresplanung')
  })

  test('returns every match, so the caller can report a true total', () => {
    const hits = Array.from({ length: 80 }, (_, index) =>
      hit(`Planung ${index}`, '', '', { flowId: index, kind: 'flow' }),
    )

    expect(matchParkIndex(hits, 'planung')).toHaveLength(80)
  })

  test('survives a hit whose title or context never reached the response', () => {
    const broken = { context: undefined, target: FLOW, text: 'Planung 2026', title: undefined }

    expect(() => matchParkIndex([broken as unknown as ParkSearchHit], 'planung')).not.toThrow()
    expect(matchParkIndex([broken as unknown as ParkSearchHit], 'planung')).toHaveLength(1)
  })
})

describe('matchParkIndex grouping', () => {
  test('joins the items of one list into one row, and counts them', () => {
    const hits = [
      listItem('Budget freigeben', 'Budget freigeben', 'Finanzen'),
      listItem('Budget prüfen', 'Budget prüfen', 'Finanzen'),
      listItem('Konto führen', 'Konto führen', 'Finanzen'),
    ]

    const matches = matchParkIndex(hits, 'budget')

    expect(matches).toHaveLength(1)
    expect(matches[0].count).toBe(2)
    expect(matches[0].hit.target).toEqual({ kind: 'listItem', listId: 5 })
  })

  test('keeps two lists apart', () => {
    const hits = [listItem('Budget A', '', 'Finanzen', 5), listItem('Budget B', '', 'Personal', 6)]

    expect(matchParkIndex(hits, 'budget')).toHaveLength(2)
  })

  test('joins a list with its own items, and lets the list name the row', () => {
    const hits = [
      hit('Finanzen', '', '', { kind: 'list', listId: 5 }),
      listItem('Budget freigeben', '', 'Finanzen'),
      listItem('Konto führen', '', 'Finanzen'),
    ]

    const matches = matchParkIndex(hits, 'finanzen')

    expect(matches).toHaveLength(1)
    expect(matches[0].hit.title).toBe('Finanzen')
  })

  test('counts no item that matched through the list name alone', () => {
    const hits = [
      hit('Finanzen', '', '', { kind: 'list', listId: 5 }),
      listItem('Budget freigeben', '', 'Finanzen'),
      listItem('Konto führen', '', 'Finanzen'),
    ]

    expect(matchParkIndex(hits, 'finanzen')[0].count).toBe(1)
  })

  test('gives two blocks of one activity their own row', () => {
    const hits = [
      hit('Planung A', '', '', { activityId: 3, blockId: 'a', kind: 'block' }),
      hit('Planung B', '', '', { activityId: 3, blockId: 'b', kind: 'block' }),
    ]

    expect(matchParkIndex(hits, 'planung')).toHaveLength(2)
  })

  test('keeps an activity apart from its own block', () => {
    const hits = [
      hit('Führung', '', '', { activityId: 3, kind: 'activity' }),
      hit('Führung Teil A', '', '', { activityId: 3, blockId: 'a', kind: 'block' }),
    ]

    expect(matchParkIndex(hits, 'führung')).toHaveLength(2)
  })
})

describe('matchParkIndex snippet', () => {
  test('shows the body around a word the title does not hold', () => {
    const body = `${'Vorbemerkung zum Ablauf. '.repeat(4)}Die Fristen stehen im Anhang.`
    const matches = matchParkIndex([hit('701 Personalwesen', body)], 'fristen')

    expect(matches[0].snippet).toContain('Fristen')
    expect(matches[0].snippet.startsWith('…')).toBe(true)
  })

  test('keeps the accents of the source in the snippet', () => {
    const body = `${'Texte introductif au sujet. '.repeat(4)}La réunion générale suit.`
    const matches = matchParkIndex([hit('701 Ressources', body)], 'reunion')

    expect(matches[0].snippet).toContain('réunion')
  })

  test('shows no snippet when the title holds every word', () => {
    expect(matchParkIndex([hit('Mehrjahresplanung', 'Ein Text')], 'planung')[0].snippet).toBe('')
  })

  test('shows no snippet when the context holds the word', () => {
    expect(matchParkIndex([hit('Budget', 'Ein Text', 'Finanzen')], 'finanzen')[0].snippet).toBe('')
  })

  test('falls back to the body opening when only the German fold reaches the word', () => {
    const body = `${'Einleitender Satz zum Thema. '.repeat(3)}Die Stolperunfaelle sind erfasst.`
    const matches = matchParkIndex([hit('510 Sicherheit', body)], 'stolperunfälle')

    expect(matches[0].snippet.startsWith('Einleitender Satz')).toBe(true)
  })

  test('adds no leading ellipsis when the word sits at the start of the body', () => {
    const matches = matchParkIndex([hit('701 Personalwesen', 'Fristen beachten')], 'fristen')

    expect(matches[0].snippet).toBe('Fristen beachten')
  })
})
