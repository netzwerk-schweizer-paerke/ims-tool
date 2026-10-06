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

  // PIMS-83: "Davor" and "Danach" next to a Prozessgruppe of the same Thema.
  test('goes directly before the anchor', () => {
    const next = insertBlock([io('in'), task('a'), task('b'), io('out')], task('new'), {
      index: 2,
      placement: 'before',
    })

    expect(next.map((block) => block.id)).toEqual(['in', 'a', 'new', 'b', 'out'])
  })

  test('goes directly after the anchor, and stays before the output', () => {
    const next = insertBlock([io('in'), task('a'), task('b'), io('out')], task('new'), {
      index: 2,
      placement: 'after',
    })

    expect(next.map((block) => block.id)).toEqual(['in', 'a', 'b', 'new', 'out'])
  })

  test('falls back to the default position when the anchor index is no task block here', () => {
    const next = insertBlock([io('in'), io('out')], task('new'), { index: 1, placement: 'after' })

    expect(next.map((block) => block.id)).toEqual(['in', 'new', 'out'])
  })
})
