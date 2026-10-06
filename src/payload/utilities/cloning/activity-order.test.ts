import { describe, expect, test } from 'vitest'

import { docOrderChanges, orderWithInsert } from '@/payload/utilities/cloning/activity-order'

describe('orderWithInsert', () => {
  test('puts the new Thema directly before the anchor', () => {
    expect(orderWithInsert([1, 2, 3], [9], 2, 'before')).toEqual([1, 9, 2, 3])
  })

  test('puts the new Thema directly after the anchor', () => {
    expect(orderWithInsert([1, 2, 3], [9], 3, 'after')).toEqual([1, 2, 3, 9])
  })

  // The clone is already in the stored order, wherever its copied `docOrder` put it.
  test('moves a new id that the stored order already holds', () => {
    expect(orderWithInsert([9, 1, 2], [9], 2, 'before')).toEqual([1, 9, 2])
  })

  test('keeps several new ids together, in their order', () => {
    expect(orderWithInsert([1, 2], [8, 9], 1, 'after')).toEqual([1, 8, 9, 2])
  })

  test('appends when the anchor is unknown', () => {
    expect(orderWithInsert([1, 2], [9], 77, 'before')).toEqual([1, 2, 9])
  })
})

describe('docOrderChanges', () => {
  test('writes only the rows whose position changed', () => {
    const stored = new Map<number, null | number>([
      [1, 1],
      [2, 2],
      [3, null],
      [9, 1],
    ])

    expect(docOrderChanges([1, 9, 2, 3], stored)).toEqual([
      { docOrder: 2, id: 9 },
      { docOrder: 3, id: 2 },
      { docOrder: 4, id: 3 },
    ])
  })
})
