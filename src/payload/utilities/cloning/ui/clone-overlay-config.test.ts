import { describe, expect, test } from 'vitest'

import { cloneTimeoutMultiplier } from './clone-overlay-config'

describe('cloneTimeoutMultiplier', () => {
  test('gives an activity clone more time per item than a task clone', () => {
    expect(cloneTimeoutMultiplier).toEqual({
      activities: 300_000,
      'task-flows': 120_000,
      'task-lists': 120_000,
    })
  })
})
