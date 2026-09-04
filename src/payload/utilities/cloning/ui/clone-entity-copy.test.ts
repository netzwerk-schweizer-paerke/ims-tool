import { describe, expect, test } from 'vitest'

import { cloneEntityKeys, cloneEntityKeysFor } from './clone-entity-copy'

describe('cloneEntityKeysFor', () => {
  test('answers the key set of each cloneable collection', () => {
    expect(cloneEntityKeysFor('task-flows')).toBe(cloneEntityKeys['task-flows'])
    expect(cloneEntityKeysFor('task-lists')).toBe(cloneEntityKeys['task-lists'])
    expect(cloneEntityKeysFor('activities')).toBe(cloneEntityKeys.activities)
  })

  // A run that cloned nothing carries no entity, so `source.collection` is absent.
  test('falls back to the activity wording for an unknown collection', () => {
    expect(cloneEntityKeysFor(undefined)).toBe(cloneEntityKeys.activities)
    expect(cloneEntityKeysFor(null)).toBe(cloneEntityKeys.activities)
    expect(cloneEntityKeysFor('documents')).toBe(cloneEntityKeys.activities)
  })

  // A missing key renders as the raw key string in the panel, so every set carries every name.
  test('gives all three collections the same key names', () => {
    const names = Object.keys(cloneEntityKeys.activities).sort()

    expect(Object.keys(cloneEntityKeys['task-flows']).sort()).toEqual(names)
    expect(Object.keys(cloneEntityKeys['task-lists']).sort()).toEqual(names)
  })

  test('points each collection at its own namespace', () => {
    for (const key of Object.values(cloneEntityKeys['task-flows'])) {
      expect(key.startsWith('cloneTaskFlow:')).toBe(true)
    }
    for (const key of Object.values(cloneEntityKeys['task-lists'])) {
      expect(key.startsWith('cloneTaskList:')).toBe(true)
    }
  })
})
