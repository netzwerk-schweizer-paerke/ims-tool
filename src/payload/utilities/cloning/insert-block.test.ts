import { describe, expect, test } from 'vitest'

import { blockInsertIndex, insertBlock } from '@/payload/utilities/cloning/insert-block'

const io = (id: string) => ({ blockType: 'activity-io', id })
const task = (id: string) => ({ blockType: 'activity-task', id })

describe('blockInsertIndex', () => {
  test('goes before a closing input/output block', () => {
    expect(blockInsertIndex([io('in'), task('a'), task('b'), io('out')])).toBe(3)
  })

  test('goes to the end when the last block is a task block', () => {
    expect(blockInsertIndex([io('in'), task('a')])).toBe(2)
  })

  test('goes between input and output of a Thema with no task block', () => {
    expect(blockInsertIndex([io('in'), io('out')])).toBe(1)
  })

  // A single input/output block is the input as well as the output. A task after it keeps it
  // as the input, which is the only reading a one-block Thema allows.
  test('goes after a single input/output block', () => {
    expect(blockInsertIndex([io('only')])).toBe(1)
  })

  test('goes first into an empty Thema', () => {
    expect(blockInsertIndex([])).toBe(0)
  })
})

describe('insertBlock', () => {
  test('keeps every stored block, in order, around the new one', () => {
    const stored = [io('in'), task('a'), io('out')]

    const next = insertBlock(stored, task('new'))

    expect(next.map((block) => block.id)).toEqual(['in', 'a', 'new', 'out'])
    expect(stored.map((block) => block.id)).toEqual(['in', 'a', 'out'])
  })
})
