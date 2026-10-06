import { describe, expect, test } from 'vitest'

import {
  appendTaskRelation,
  findBlockIndex,
  type StoredBlock,
} from '@/payload/utilities/cloning/block-position'

const block = (id: string, relations?: StoredBlock['relations']): StoredBlock => ({
  blockType: 'activity-task',
  id,
  relations: relations ?? { tasks: [] },
})

describe('findBlockIndex', () => {
  test('finds the index through the locale that holds the id', () => {
    const index = findBlockIndex(
      { de: [block('d0'), block('d1')], fr: [block('f0'), block('f1')] },
      'f1',
    )

    expect(index).toBe(1)
  })

  test('skips a locale with no stored blocks', () => {
    expect(findBlockIndex({ de: null, fr: [block('f0')] }, 'f0')).toBe(0)
  })

  test('answers -1 for an unknown id', () => {
    expect(findBlockIndex({ de: [block('d0')] }, 'missing')).toBe(-1)
  })
})

describe('appendTaskRelation', () => {
  test('appends to the block at the index and keeps every other block and id', () => {
    const blocks = [block('a'), block('b', { tasks: [{ relationTo: 'task-lists', value: 4 }] })]

    const next = appendTaskRelation(blocks, 1, { id: 9, relationTo: 'task-flows' })

    expect(next?.[0]).toBe(blocks[0])
    expect(next?.[1].id).toBe('b')
    expect(next?.[1].relations?.tasks).toEqual([
      { relationTo: 'task-lists', value: 4 },
      { relationTo: 'task-flows', value: 9 },
    ])
    // The input stays untouched, so a failed write leaves nothing half changed.
    expect(blocks[1].relations?.tasks).toHaveLength(1)
  })

  test('answers null when the block already links the task, as an id or populated', () => {
    const blocks = [block('a', { tasks: [{ relationTo: 'task-flows', value: { id: 9 } }] })]

    expect(appendTaskRelation(blocks, 0, { id: 9, relationTo: 'task-flows' })).toBeNull()
  })

  test('treats a task flow and a task list of the same id as different tasks', () => {
    const blocks = [block('a', { tasks: [{ relationTo: 'task-lists', value: 9 }] })]

    expect(appendTaskRelation(blocks, 0, { id: 9, relationTo: 'task-flows' })).not.toBeNull()
  })

  test('answers null when the block at the index is an input/output block in this locale', () => {
    const blocks = [{ blockType: 'activity-io', id: 'out', relations: { tasks: [] } }]

    expect(appendTaskRelation(blocks, 0, { id: 9, relationTo: 'task-flows' })).toBeNull()
  })

  test('answers null when the locale has no block at the index', () => {
    expect(appendTaskRelation([block('a')], 3, { id: 9, relationTo: 'task-flows' })).toBeNull()
  })

  test('starts the relation list of a block that has none', () => {
    const next = appendTaskRelation([{ blockType: 'activity-task', id: 'a' }], 0, {
      id: 9,
      relationTo: 'task-flows',
    })

    expect(next?.[0].relations?.tasks).toEqual([{ relationTo: 'task-flows', value: 9 }])
  })
})

// PIMS-83: "Davor" and "Danach" next to a task of the same Prozessgruppe.
describe('appendTaskRelation with an anchor', () => {
  const three = () => [
    block('a', {
      tasks: [
        { relationTo: 'task-flows', value: 1 },
        { relationTo: 'task-lists', value: 2 },
        { relationTo: 'task-flows', value: 3 },
      ],
    }),
  ]
  const order = (blocks: null | StoredBlock[]) =>
    blocks?.[0].relations?.tasks?.map((t) => `${t.relationTo}:${String(t.value)}`)

  test('inserts directly before the anchor', () => {
    const next = appendTaskRelation(three(), 0, { id: 9, relationTo: 'task-lists' }, {
      anchorCollection: 'task-lists',
      anchorId: 2,
      placement: 'before',
    })

    expect(order(next)).toEqual(['task-flows:1', 'task-lists:9', 'task-lists:2', 'task-flows:3'])
  })

  test('inserts directly after the anchor', () => {
    const next = appendTaskRelation(three(), 0, { id: 9, relationTo: 'task-lists' }, {
      anchorCollection: 'task-lists',
      anchorId: 2,
      placement: 'after',
    })

    expect(order(next)).toEqual(['task-flows:1', 'task-lists:2', 'task-lists:9', 'task-flows:3'])
  })

  test('tells a task flow and a task list of one id apart as the anchor', () => {
    const next = appendTaskRelation(three(), 0, { id: 9, relationTo: 'task-flows' }, {
      anchorCollection: 'task-lists',
      anchorId: 1,
      placement: 'before',
    })

    expect(order(next)?.at(-1)).toBe('task-flows:9')
  })

  test('appends when this locale does not hold the anchor', () => {
    const next = appendTaskRelation(three(), 0, { id: 9, relationTo: 'task-flows' }, {
      anchorCollection: 'task-flows',
      anchorId: 77,
      placement: 'before',
    })

    expect(order(next)?.at(-1)).toBe('task-flows:9')
  })
})
