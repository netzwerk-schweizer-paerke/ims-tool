import { describe, expect, test } from 'vitest'

import { collectDocumentParents } from '@/lib/search/collect-document-parents'

const empty = { activities: [], taskFlows: [], taskLists: [] }

/** A Lexical document whose only paragraph holds one link node. */
const linkTo = (relationTo: string, value: unknown) => ({
  root: {
    children: [
      {
        children: [{ fields: { doc: { relationTo, value } }, type: 'link' }],
        type: 'paragraph',
      },
    ],
    type: 'root',
  },
})

describe('collectDocumentParents', () => {
  test('returns nothing for an empty park', () => {
    expect(collectDocumentParents(empty).size).toBe(0)
  })

  test('names the record whose files array attaches the document', () => {
    const parents = collectDocumentParents({
      ...empty,
      activities: [{ files: [{ document: 42 }], name: 'Führung' }],
    })

    expect(parents.get(42)).toBe('Führung')
  })

  test('reads a link node of a description', () => {
    const parents = collectDocumentParents({
      ...empty,
      taskFlows: [{ description: linkTo('documents', 7), name: 'Jahresplanung' }],
    })

    expect(parents.get(7)).toBe('Jahresplanung')
  })

  test('reads an upload node nested in a block', () => {
    const parents = collectDocumentParents({
      ...empty,
      activities: [
        {
          blocks: [{ infos: { norms: { root: { children: [], type: 'root' } } } }],
          files: [{ document: { id: 9 } }],
          name: 'Sicherheit',
        },
      ],
    })

    expect(parents.get(9)).toBe('Sicherheit')
  })

  test('reads a relationship node that carries the collection beside the value', () => {
    const parents = collectDocumentParents({
      ...empty,
      taskLists: [
        {
          items: [{ tools: { relationTo: 'documents', type: 'relationship', value: 3 } }],
          name: 'Finanzen',
        },
      ],
    })

    expect(parents.get(3)).toBe('Finanzen')
  })

  test('ignores a reference to the shared pool, which has its own id sequence', () => {
    const parents = collectDocumentParents({
      ...empty,
      taskFlows: [{ description: linkTo('documents-public', 7), name: 'Jahresplanung' }],
    })

    expect(parents.size).toBe(0)
  })

  test('keeps the first record that references the document', () => {
    const parents = collectDocumentParents({
      ...empty,
      activities: [
        { files: [{ document: 5 }], name: 'Erste' },
        { files: [{ document: 5 }], name: 'Zweite' },
      ],
    })

    expect(parents.get(5)).toBe('Erste')
  })

  test('skips a record with no name in the requested locale', () => {
    const parents = collectDocumentParents({
      ...empty,
      activities: [{ files: [{ document: 5 }], name: undefined }],
    })

    expect(parents.size).toBe(0)
  })
})
