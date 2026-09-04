import { describe, expect, test } from 'vitest'

import { coerceRichTextFieldHook } from '@/payload/collections/hooks/coerce-rich-text-field-hook'

type LexicalNode = Record<string, unknown>
type LexicalParent = { children: LexicalNode[]; type?: string }

// The hook reads only `value`; the real FieldHook argument object is far larger.
const invoke = (value: unknown) =>
  (coerceRichTextFieldHook as (a: unknown) => unknown)({ value }) as Record<string, never>

const rootOf = (value: unknown) => (value as { root: LexicalParent }).root

const firstParagraph = (value: unknown) => {
  const [paragraph] = rootOf(value).children as unknown as LexicalParent[]
  return paragraph
}

const firstText = (value: unknown) => {
  const [node] = firstParagraph(value).children
  return node.text
}

describe('coerceRichTextFieldHook', () => {
  test('wraps a plain string in a Lexical document', () => {
    const result = invoke('Die Sicherheit der Mitarbeitenden gewährleisten.')

    expect(rootOf(result).type).toBe('root')
    expect(firstText(result)).toBe('Die Sicherheit der Mitarbeitenden gewährleisten.')
  })

  test('gives the wrapped string one paragraph that holds one node', () => {
    const paragraph = firstParagraph(invoke('a'))

    expect(rootOf(invoke('a')).children).toHaveLength(1)
    expect(paragraph.type).toBe('paragraph')
    expect(paragraph.children).toHaveLength(1)
  })

  test('writes a text node with the key set the editor stores', () => {
    expect(firstParagraph(invoke('a')).children).toEqual([
      {
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: 'a',
        type: 'text',
        version: 1,
      },
    ])
  })

  test('gives an empty string an empty paragraph and no text node', () => {
    expect(rootOf(invoke('')).children).toHaveLength(1)
    expect(firstParagraph(invoke('')).children).toEqual([])
  })

  test('wraps a number and a boolean, so the column never holds a primitive', () => {
    expect(firstText(invoke(42))).toBe('42')
    expect(firstText(invoke(true))).toBe('true')
  })

  test('returns a value that carries a root, which the plugin guard requires', () => {
    const result = invoke('a')

    expect(typeof result).toBe('object')
    expect('root' in result).toBe(true)
  })

  test('passes an existing Lexical document through unchanged', () => {
    const value = { root: { children: [], type: 'root' } }

    expect(invoke(value)).toBe(value)
  })

  test('passes a Slate array through unchanged', () => {
    const value = [{ children: [{ text: 'a' }], type: 'paragraph' }]

    expect(invoke(value)).toBe(value)
  })

  test('passes null and undefined through, because they mean an empty field', () => {
    expect(invoke(null)).toBeNull()
    expect(invoke(undefined)).toBeUndefined()
  })
})
