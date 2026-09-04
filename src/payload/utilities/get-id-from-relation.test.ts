import { describe, expect, test } from 'vitest'

import { getIdFromRelation } from './get-id-from-relation'

describe('getIdFromRelation', () => {
  test('returns a bare id, which is how a depth 0 read returns a relationship', () => {
    expect(getIdFromRelation(19)).toBe(19)
  })

  test('returns the id of a populated document, which is how a deeper read returns it', () => {
    expect(getIdFromRelation({ id: 19, name: 'Musterpark' })).toBe(19)
  })

  test('returns 0 rather than null, because 0 is falsy but is still an id', () => {
    expect(getIdFromRelation(0)).toBe(0)
    expect(getIdFromRelation({ id: 0 })).toBe(0)
  })

  test.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty object', {}],
    ['an array', []],
    ['a numeric string', '19'],
    ['a document with a string id', { id: '19' }],
    ['a document with a null id', { id: null }],
  ])('returns null for %s', (_label, input) => {
    expect(getIdFromRelation(input)).toBeNull()
  })

  // `isNumber` from es-toolkit/compat accepts both, so the old helper passed them through
  // to a `where` clause as an organisation id.
  test.each([
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['a fraction', 1.5],
    ['a document with NaN as its id', { id: NaN }],
  ])('returns null for %s', (_label, input) => {
    expect(getIdFromRelation(input)).toBeNull()
  })
})
