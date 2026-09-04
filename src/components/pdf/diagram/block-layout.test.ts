import { describe, expect, test } from 'vitest'

import { Activity } from '@/payload-types'

import {
  blocksPerSlice,
  blockWidthOf,
  DEFAULT_LAYOUT,
  layoutActivityColumn,
  layoutActivityRow,
  sliceRow,
} from './block-layout'

const block =(id: string, blockType: string, text?: string) => ({
  blockType,
  graph: { task: { text } },
  id,
})

const activity = (name: string, blocks: unknown[]): Activity =>
  ({ blocks, name }) as unknown as Activity

const ORIGIN = { x: 0, y: 0 }

describe('layoutActivityColumn', () => {
  test('stacks an input, the tasks and an output in that order', () => {
    const column = layoutActivityColumn(
      activity('Wirtschaft', [
        block('in', 'activity-io', 'Input'),
        block('t1', 'activity-task', 'Task one'),
        block('t2', 'activity-task', 'Task two'),
        block('out', 'activity-io', 'Output'),
      ]),
      ORIGIN,
    )

    expect(column.blocks.map((b) => b.id)).toEqual(['in', 't1', 't2', 'out'])
    expect(column.blocks.map((b) => b.shape)).toEqual(['io', 'task', 'task', 'io'])
  })

  test('spaces the blocks by the block height plus the gap', () => {
    const column = layoutActivityColumn(
      activity('A', [block('a', 'activity-task'), block('b', 'activity-task')]),
      ORIGIN,
    )

    expect(column.blocks[0].rects.outer.y).toBe(0)
    expect(column.blocks[1].rects.outer.y).toBe(DEFAULT_LAYOUT.blockHeight + DEFAULT_LAYOUT.gap)
  })

  test('reports the stacked height, with no gap after the last block', () => {
    const column = layoutActivityColumn(
      activity('A', [block('a', 'activity-task'), block('b', 'activity-task')]),
      ORIGIN,
    )

    expect(column.height).toBe(DEFAULT_LAYOUT.blockHeight * 2 + DEFAULT_LAYOUT.gap)
  })

  test('reports zero height for an activity with no blocks', () => {
    const column = layoutActivityColumn(activity('Empty', []), ORIGIN)

    expect(column.blocks).toEqual([])
    expect(column.height).toBe(0)
  })

  test('drops an io block that sits in the middle, as the screen does', () => {
    const column = layoutActivityColumn(
      activity('A', [
        block('t1', 'activity-task'),
        block('stray', 'activity-io'),
        block('t2', 'activity-task'),
      ]),
      ORIGIN,
    )

    expect(column.blocks.map((b) => b.id)).toEqual(['t1', 't2'])
  })

  test('keeps a block with no label, so the arrows keep their slots', () => {
    const column = layoutActivityColumn(activity('A', [block('a', 'activity-task')]), ORIGIN)

    expect(column.blocks[0].label).toBe('')
  })

  test('offsets every block from the origin', () => {
    const column = layoutActivityColumn(
      activity('A', [block('a', 'activity-task')]),
      { x: 40, y: 60 },
    )

    expect(column.blocks[0].rects.outer).toMatchObject({ x: 40, y: 60 })
  })
})

describe('layoutActivityRow', () => {
  test('places one column per activity, left to right', () => {
    const columns = layoutActivityRow(
      [
        activity('One', [block('a', 'activity-task')]),
        activity('Two', [block('b', 'activity-task')]),
      ],
      ORIGIN,
      10,
    )

    expect(columns[0].blocks[0].rects.outer.x).toBe(0)
    expect(columns[1].blocks[0].rects.outer.x).toBe(blockWidthOf(DEFAULT_LAYOUT) + 10)
  })

  test('returns nothing for an empty row', () => {
    expect(layoutActivityRow([], ORIGIN, 10)).toEqual([])
  })
})

describe('blocksPerSlice', () => {
  test('counts the blocks that fit, with no gap after the last one', () => {
    const { blockHeight, gap } = DEFAULT_LAYOUT

    expect(blocksPerSlice(blockHeight * 3 + gap * 2, DEFAULT_LAYOUT)).toBe(3)
  })

  test('never reports zero, so a slice always carries one block', () => {
    expect(blocksPerSlice(1, DEFAULT_LAYOUT)).toBe(1)
  })
})

describe('sliceRow', () => {
  const rowOf = (...counts: number[]) =>
    layoutActivityRow(
      counts.map((count, index) =>
        activity(`A${index}`, Array.from({ length: count }, (_, i) => block(`b${index}-${i}`, 'activity-task'))),
      ),
      ORIGIN,
      10,
    )

  test('returns one slice when every column fits', () => {
    expect(sliceRow(rowOf(3), 5, DEFAULT_LAYOUT)).toHaveLength(1)
  })

  test('cuts every column at the same index, so the columns stay aligned', () => {
    const slices = sliceRow(rowOf(7, 3), 5, DEFAULT_LAYOUT)

    expect(slices).toHaveLength(2)
    expect(slices[0].map((column) => column.blocks.length)).toEqual([5, 3])
    expect(slices[1].map((column) => column.blocks.length)).toEqual([2, 0])
  })

  test('moves each slice back to the row origin', () => {
    const slices = sliceRow(rowOf(7), 5, DEFAULT_LAYOUT)

    expect(slices[1][0].blocks[0].rects.outer.y).toBe(ORIGIN.y)
  })

  test('keeps the block size, so a label still fits its shape', () => {
    const slices = sliceRow(rowOf(9), 5, DEFAULT_LAYOUT)

    expect(slices[0][0].blocks[0].rects.outer.height).toBe(DEFAULT_LAYOUT.blockHeight)
  })

  test('reports the height of each slice, not of the whole column', () => {
    const slices = sliceRow(rowOf(7), 5, DEFAULT_LAYOUT)
    const { blockHeight, gap } = DEFAULT_LAYOUT

    expect(slices[1][0].height).toBe(blockHeight * 2 + gap)
  })
})
