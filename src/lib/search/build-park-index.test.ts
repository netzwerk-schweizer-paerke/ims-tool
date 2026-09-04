import { describe, expect, test } from 'vitest'

import { buildParkIndex } from '@/lib/search/build-park-index'

/** The generated richText type demands the full root shape, so a fixture states every key. */
const lexical = (text: string) => ({
  root: {
    children: [{ children: [{ text, type: 'text', version: 1 }], type: 'paragraph', version: 1 }],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'root',
    version: 1,
  },
})

const empty = { activities: [], documents: [], taskFlows: [], taskLists: [] }

describe('buildParkIndex', () => {
  test('returns nothing for an empty park', () => {
    expect(buildParkIndex(empty)).toEqual([])
  })

  test('emits an activity and one hit per block, with the block route', () => {
    const hits = buildParkIndex({
      ...empty,
      activities: [
        {
          blocks: [
            {
              blockType: 'activity-task',
              graph: { task: { connections: [], text: '101\nMehrjahresplanung' } },
              id: 'block-a',
              infos: { norms: lexical('ISO 9001') },
            },
          ],
          description: lexical('Der Führungsprozess'),
          id: 7,
          name: 'Führung',
        },
      ],
    })

    expect(hits).toEqual([
      {
        context: '',
        target: { activityId: 7, kind: 'activity' },
        text: 'Der Führungsprozess',
        title: 'Führung',
      },
      {
        context: 'Führung',
        target: { activityId: 7, blockId: 'block-a', kind: 'block' },
        text: 'ISO 9001',
        title: '101 Mehrjahresplanung',
      },
    ])
  })

  test('skips a block that carries no id, because no route reaches it', () => {
    const hits = buildParkIndex({
      ...empty,
      activities: [
        {
          blocks: [{ blockType: 'activity-task', graph: { task: { connections: [], text: 'X' } } }],
          description: null,
          id: 7,
          name: 'Führung',
        },
      ],
    })

    expect(hits).toHaveLength(1)
    expect(hits[0].target).toEqual({ activityId: 7, kind: 'activity' })
  })

  test('folds the blocks of a flow into the flow hit, because a block has no own route', () => {
    const hits = buildParkIndex({
      ...empty,
      taskFlows: [
        {
          blocks: [
            {
              blockType: 'proc-task-p',
              graph: { task: { connections: [], text: 'Termin planen' } },
              id: 'flow-block',
              keypoints: { keypoints: lexical('Fristen beachten') },
            },
          ],
          description: null,
          id: 3,
          name: 'Jahresplanung',
        },
      ],
    })

    expect(hits).toHaveLength(1)
    expect(hits[0].target).toEqual({ flowId: 3, kind: 'flow' })
    expect(hits[0].text).toContain('Termin planen')
    expect(hits[0].text).toContain('Fristen beachten')
  })

  test('emits one hit per list item, and sends it to the list page', () => {
    const hits = buildParkIndex({
      ...empty,
      taskLists: [
        {
          description: null,
          id: 11,
          items: [
            {
              id: 'item-1',
              responsibility: lexical('Geschäftsleitung'),
              tools: lexical('Vorlage'),
              topic: lexical('Budget freigeben'),
            },
          ],
          name: 'Finanzen',
        },
      ],
    })

    expect(hits).toHaveLength(2)
    expect(hits[1]).toEqual({
      context: 'Finanzen',
      target: { kind: 'listItem', listId: 11 },
      text: 'Budget freigeben · Vorlage · Geschäftsleitung',
      title: 'Budget freigeben',
    })
  })

  test('cuts a paragraph topic down to a title, and keeps the whole text searchable', () => {
    const paragraph =
      'Réunion de planification avec le service forestier. Réservation des semaines. Contact.'
    const hits = buildParkIndex({
      ...empty,
      taskLists: [
        {
          description: null,
          id: 11,
          items: [{ id: 'item-1', responsibility: null, tools: null, topic: lexical(paragraph) }],
          name: 'Finanzen',
        },
      ],
    })

    expect(hits[1].title).toBe('Réunion de planification avec le service forestier')
    expect(hits[1].text).toContain('Réservation des semaines')
  })

  test('truncates a first sentence that runs past the title limit', () => {
    const long = `${'sehr lange Aufgabe '.repeat(10)}Ende`
    const hits = buildParkIndex({
      ...empty,
      taskLists: [
        {
          description: null,
          id: 11,
          items: [{ id: 'item-1', responsibility: null, tools: null, topic: lexical(long) }],
          name: 'Finanzen',
        },
      ],
    })

    expect(hits[1].title).toHaveLength(81)
    expect(hits[1].title.endsWith('…')).toBe(true)
  })

  test('gives an empty title to a record with no name in the requested locale', () => {
    // Two activities and nine task flows have no German name in production data. The
    // fallback locale holds no row either, so Payload answers `name: undefined`.
    const hits = buildParkIndex({
      ...empty,
      activities: [
        {
          blocks: [
            { blockType: 'activity-task', graph: { task: { connections: [], text: 'X' } }, id: 'b' },
          ],
          description: null,
          id: 175,
          name: undefined as unknown as string,
        },
      ],
    })

    expect(hits[0].title).toBe('')
    expect(hits[1].context).toBe('')
  })

  test('falls back to the filename when a document carries no name', () => {
    const hits = buildParkIndex({
      ...empty,
      documents: [{ description: null, filename: 'charta.pdf', id: 5, name: null }],
    })

    expect(hits[0]).toEqual({
      context: '',
      target: { documentId: 5, kind: 'document' },
      text: 'charta.pdf',
      title: 'charta.pdf',
    })
  })

  test('removes the epoch prefix an upload puts before the filename', () => {
    const hits = buildParkIndex({
      ...empty,
      documents: [
        {
          description: null,
          filename: '1758561330630-1756312477131-101_V_Finanzplanung-1.xlsx',
          id: 5,
          name: null,
        },
      ],
    })

    expect(hits[0].title).toBe('101_V_Finanzplanung-1.xlsx')
    expect(hits[0].text).toBe('101_V_Finanzplanung-1.xlsx')
  })

  test('keeps a filename that only starts with digits', () => {
    const hits = buildParkIndex({
      ...empty,
      documents: [{ description: null, filename: '101_V_Finanzplanung-1.xlsx', id: 5, name: null }],
    })

    expect(hits[0].title).toBe('101_V_Finanzplanung-1.xlsx')
  })

  test('names the record that uses a document as its context', () => {
    const hits = buildParkIndex({
      ...empty,
      documentParents: new Map([[5, 'Führung']]),
      documents: [{ description: null, filename: 'charta.pdf', id: 5, name: null }],
    })

    expect(hits[0].context).toBe('Führung')
  })

  test('leaves the context empty for a document no record uses', () => {
    const hits = buildParkIndex({
      ...empty,
      documentParents: new Map([[9, 'Führung']]),
      documents: [{ description: null, filename: 'charta.pdf', id: 5, name: null }],
    })

    expect(hits[0].context).toBe('')
  })
})
