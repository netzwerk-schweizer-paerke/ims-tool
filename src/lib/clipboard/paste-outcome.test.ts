import { describe, expect, test } from 'vitest'

import { findNewPasteKey, pasteOutcome } from '@/lib/clipboard/paste-outcome'

const results = (successLevel: 'fail' | 'partial' | 'success') => ({
  aggregated: {},
  entities: [],
  successLevel,
})

describe('pasteOutcome', () => {
  test('reads a complete clone as a success', () => {
    expect(pasteOutcome(true, 200, { results: results('success') })).toEqual({ kind: 'success' })
  })

  test('reads a partial clone as a result with issues', () => {
    const partial = results('partial')

    expect(pasteOutcome(true, 200, { results: partial })).toEqual({
      kind: 'issues',
      results: partial,
    })
  })

  test('reads a refused paste with its message and details', () => {
    expect(
      pasteOutcome(false, 400, { details: ['name: required'], error: 'Failed to clone' }),
    ).toEqual({ details: ['name: required'], error: 'Failed to clone', kind: 'failed' })
  })

  test('names the status when the error body is not JSON', () => {
    expect(pasteOutcome(false, 502, null)).toEqual({ details: [], error: 'HTTP 502', kind: 'failed' })
  })
})

describe('findNewPasteKey', () => {
  test('answers the first key that did not exist before the paste', () => {
    const before = new Set(['activity:1', 'activity:2'])

    expect(findNewPasteKey(before, ['activity:1', 'activity:9', 'activity:2'])).toBe('activity:9')
  })

  test('answers null when the page shows no new item', () => {
    expect(findNewPasteKey(new Set(['block:a']), ['block:a'])).toBeNull()
  })
})
