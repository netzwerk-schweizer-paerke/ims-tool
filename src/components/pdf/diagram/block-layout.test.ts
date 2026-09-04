import { describe, expect, test } from 'vitest'

import { Activity } from '@/payload-types'

import {
  blocksPerSlice,
  blockWidthOf,
  DEFAULT_LAYOUT,
  gridRowsPerSlice,
  layoutActivityColumn,
  layoutActivityGrid,
  layoutActivityRow,
  sliceGrid,
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

describe('layoutActivityGrid', () => {
  const GAP = 16
  const gridOf = (count: number, availableWidth: number) =>
    layoutActivityGrid(
      activity(
        'Unterstützung',
        Array.from({ length: count }, (_, i) => block(`b${i}`, 'activity-task')),
      ),
      ORIGIN,
      availableWidth,
      GAP,
    )

  const rowWidth = (perRow: number) => perRow * (blockWidthOf(DEFAULT_LAYOUT) + GAP) - GAP

  test('wraps the blocks once the row is full', () => {
    const grid = gridOf(8, rowWidth(6))

    expect(grid.blocks.map((b) => b.rects.outer.y)).toEqual([
      0, 0, 0, 0, 0, 0,
      DEFAULT_LAYOUT.blockHeight,
      DEFAULT_LAYOUT.blockHeight,
    ])
  })

  test('places the blocks left to right within a row', () => {
    const step = blockWidthOf(DEFAULT_LAYOUT) + GAP
    const grid = gridOf(3, rowWidth(6))

    expect(grid.blocks.map((b) => b.rects.outer.x)).toEqual([0, step, step * 2])
  })

  test('reports the height in whole rows', () => {
    expect(gridOf(8, rowWidth(6)).height).toBe(DEFAULT_LAYOUT.blockHeight * 2)
    expect(gridOf(6, rowWidth(6)).height).toBe(DEFAULT_LAYOUT.blockHeight)
  })

  test('keeps one block per row when the width holds none', () => {
    const grid = gridOf(3, 1)

    expect(grid.blocks.map((b) => b.rects.outer.x)).toEqual([0, 0, 0])
    expect(grid.height).toBe(DEFAULT_LAYOUT.blockHeight * 3)
  })

  test('reports zero height for an activity with no blocks', () => {
    expect(gridOf(0, rowWidth(6)).height).toBe(0)
  })
})

describe('gridRowsPerSlice', () => {
  test('counts the whole rows that fit', () => {
    expect(gridRowsPerSlice(DEFAULT_LAYOUT.blockHeight * 3, DEFAULT_LAYOUT)).toBe(3)
  })

  test('never reports zero, so a slice always carries one row', () => {
    expect(gridRowsPerSlice(1, DEFAULT_LAYOUT)).toBe(1)
  })
})

describe('sliceGrid', () => {
  const GAP = 16
  const wide = 6 * (blockWidthOf(DEFAULT_LAYOUT) + GAP) - GAP
  const gridOf = (count: number) => [
    layoutActivityGrid(
      activity(
        'Unterstützung',
        Array.from({ length: count }, (_, i) => block(`b${i}`, 'activity-task')),
      ),
      ORIGIN,
      wide,
      GAP,
    ),
  ]

  test('returns one slice when every row fits', () => {
    expect(sliceGrid(gridOf(8), 5, DEFAULT_LAYOUT)).toHaveLength(1)
  })

  test('cuts on the row, so a row is never split between two slices', () => {
    const slices = sliceGrid(gridOf(18), 2, DEFAULT_LAYOUT)

    expect(slices).toHaveLength(2)
    expect(slices[0][0].blocks.map((b) => b.id)).toEqual([
      'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10', 'b11',
    ])
    expect(slices[1][0].blocks.map((b) => b.id)).toEqual(['b12', 'b13', 'b14', 'b15', 'b16', 'b17'])
  })

  test('moves each slice back to the top', () => {
    const slices = sliceGrid(gridOf(18), 2, DEFAULT_LAYOUT)

    expect(slices[1][0].blocks[0].rects.outer.y).toBe(ORIGIN.y)
  })

  test('reports the height of each slice, not of the whole grid', () => {
    const slices = sliceGrid(gridOf(18), 2, DEFAULT_LAYOUT)

    expect(slices[0][0].height).toBe(DEFAULT_LAYOUT.blockHeight * 2)
    expect(slices[1][0].height).toBe(DEFAULT_LAYOUT.blockHeight)
  })
})
