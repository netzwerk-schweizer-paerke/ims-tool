import { describe, expect, test } from 'vitest'

import { joinSearchText, toSearchText } from '@/lib/search/to-search-text'

const lexical = (...texts: string[]) => ({
  root: {
    children: [
      {
        children: texts.map((text) => ({ text, type: 'text' })),
        type: 'paragraph',
      },
    ],
    type: 'root',
  },
})

describe('toSearchText', () => {
  test('returns a plain string unchanged', () => {
    expect(toSearchText('  Mehrjahresplanung  ')).toBe('Mehrjahresplanung')
  })

  test('flattens a Lexical document to its text nodes', () => {
    expect(toSearchText(lexical('Charta', 'Teil A'))).toBe('Charta Teil A')
  })

  test('reads a link node through its children', () => {
    const value = {
      root: {
        children: [
          {
            children: [{ text: 'Handbuch', type: 'text' }],
            fields: { url: 'https://example.test' },
            type: 'link',
          },
        ],
        type: 'root',
      },
    }

    expect(toSearchText(value)).toBe('Handbuch')
  })

  test('reads every label key of a graph JSON value', () => {
    const graph = { connections: [], text: '101\nMehrjahresplanung', textRight: 'jährlich' }

    expect(toSearchText(graph)).toBe('101\nMehrjahresplanung jährlich')
  })

  test('returns an empty string for an absent or unusable value', () => {
    expect(toSearchText(null)).toBe('')
    expect(toSearchText(undefined)).toBe('')
    expect(toSearchText(42)).toBe('')
    expect(toSearchText([1, 2])).toBe('')
    expect(toSearchText({ connections: [] })).toBe('')
  })
})

describe('joinSearchText', () => {
  test('joins the values that carry text and drops the empty ones', () => {
    expect(joinSearchText([lexical('Input'), null, '', 'Output'])).toBe('Input · Output')
  })

  test('returns an empty string when no value carries text', () => {
    expect(joinSearchText([null, undefined, ''])).toBe('')
  })
})
