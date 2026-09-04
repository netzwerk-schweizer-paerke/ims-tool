import { describe, expect, test } from 'vitest'

import { matchParkIndex } from '@/lib/search/match-park-index'
import { ParkSearchHit, ParkSearchTarget } from '@/lib/search/types'

const FLOW: ParkSearchTarget = { flowId: 1, kind: 'flow' }
const DOCUMENT: ParkSearchTarget = { documentId: 1, kind: 'document' }

const hit = (
  title: string,
  text = '',
  context = '',
  target: ParkSearchTarget = FLOW,
): ParkSearchHit => ({ context, target, text, title })

const titles = (hits: ParkSearchHit[]) => hits.map((entry) => entry.title)

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
    const hits = [hit('Charta Teil A'), hit('Charta')]

    expect(titles(matchParkIndex(hits, 'teil charta'))).toEqual(['Charta Teil A'])
  })

  test('drops a hit that holds no field with the word', () => {
    expect(matchParkIndex([hit('Charta', 'Teil A', 'Führung')], 'budget')).toEqual([])
  })
})

describe('matchParkIndex weighting', () => {
  test('ranks the title above the context, and the context above the body', () => {
    const hits = [
      hit('Zusammenarbeit', 'Die Charta nennt es', ''),
      hit('Kooperation', '', 'Charta und Ziele'),
      hit('Interne Charta'),
    ]

    expect(titles(matchParkIndex(hits, 'charta'))).toEqual([
      'Interne Charta',
      'Kooperation',
      'Zusammenarbeit',
    ])
  })

  test('ranks a title prefix above a word start, and a word start above a mid-word match', () => {
    const hits = [hit('Personalplanung'), hit('Interne Planung'), hit('Planung 2026')]

    expect(titles(matchParkIndex(hits, 'planung'))).toEqual([
      'Planung 2026',
      'Interne Planung',
      'Personalplanung',
    ])
  })

  test('breaks a tie by kind, so a document sits below a page', () => {
    const hits = [hit('Charta', '', '', DOCUMENT), hit('Charta', '', '', FLOW)]

    expect(matchParkIndex(hits, 'charta')[0].target.kind).toBe('flow')
  })

  test('a kind weight never outranks a better field match', () => {
    const hits = [
      hit('Charta 2026', '', '', DOCUMENT),
      hit('Anhang', 'Die Charta liegt bei', '', FLOW),
    ]

    expect(titles(matchParkIndex(hits, 'charta'))).toEqual(['Charta 2026', 'Anhang'])
  })

  test('sums the score over every word', () => {
    const hits = [hit('Charta Teil A'), hit('Charta', 'Teil A')]

    expect(titles(matchParkIndex(hits, 'charta teil'))).toEqual(['Charta Teil A', 'Charta'])
  })

  test('gives a paragraph title no word-start bonus, so a real name outranks it', () => {
    const paragraph = `Saisonplanung mit dem Forstdienst ${'und weiteren Beteiligten '.repeat(2)}`
    const hits = [hit(paragraph.slice(0, 80)), hit('101 Mehrjahresplanung')]

    expect(titles(matchParkIndex(hits, 'planung'))[0]).toBe('101 Mehrjahresplanung')
  })

  test('returns every match, so the caller can report a true total', () => {
    const hits = Array.from({ length: 80 }, (_, index) => hit(`Planung ${index}`))

    expect(matchParkIndex(hits, 'planung')).toHaveLength(80)
  })

  test('survives a hit whose title or context never reached the response', () => {
    const broken = { context: undefined, target: FLOW, text: 'Planung 2026', title: undefined }

    expect(() =>
      matchParkIndex([broken as unknown as ParkSearchHit], 'planung'),
    ).not.toThrow()
    expect(matchParkIndex([broken as unknown as ParkSearchHit], 'planung')).toHaveLength(1)
  })
})
