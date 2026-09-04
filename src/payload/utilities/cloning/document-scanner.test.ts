import { describe, expect, test } from 'vitest'

import {
  scanActivityForDocumentIds,
  scanActivityForTaskRelations,
  scanTaskFlowForDocumentIds,
  scanTaskForDocumentIds,
  scanTaskListForDocumentIds,
} from './document-scanner'

const documentLink = (documentId: number) => ({
  root: {
    children: [
      {
        children: [
          {
            children: [{ text: 'Plan', type: 'text' }],
            fields: { doc: { relationTo: 'documents', value: documentId }, linkType: 'internal' },
            type: 'link',
          },
        ],
        type: 'paragraph',
      },
    ],
    type: 'root',
  },
})

const ascending = (ids: number[]) => [...ids].sort((a, b) => a - b)

describe('scanTaskFlowForDocumentIds', () => {
  // The previous scanner walked a `tasks` array the collection never had, and found nothing.
  test('finds the files, the description and every block rich text', () => {
    const taskFlow = {
      blocks: [
        {
          keypoints: { keypoints: documentLink(2) },
          responsibility: { responsibility: documentLink(3) },
          tools: { tools: documentLink(4) },
        },
      ],
      description: documentLink(1),
      files: [{ document: 5 }, { document: { id: 6, name: 'Plan' } }, { document: null }],
    }

    expect(ascending(scanTaskFlowForDocumentIds(taskFlow))).toEqual([1, 2, 3, 4, 5, 6])
  })

  test('answers nothing for a value that is not a record', () => {
    expect(scanTaskFlowForDocumentIds(null)).toEqual([])
  })
})

describe('scanTaskListForDocumentIds', () => {
  test('finds the files, the description and every item rich text', () => {
    const taskList = {
      description: documentLink(1),
      files: [{ document: 5 }],
      items: [{ responsibility: documentLink(2), tools: documentLink(3), topic: documentLink(4) }],
    }

    expect(ascending(scanTaskListForDocumentIds(taskList))).toEqual([1, 2, 3, 4, 5])
  })
})

describe('scanActivityForTaskRelations', () => {
  test('reads the task of each block relation, populated or raw, and skips every other relation', () => {
    const activity = {
      blocks: [
        {
          relations: {
            tasks: [
              { relationTo: 'task-flows', value: { id: 55, name: 'Flow' } },
              { relationTo: 'task-lists', value: 9 },
            ],
          },
        },
        {
          relations: {
            tasks: [
              { relationTo: 'documents', value: 3 },
              { relationTo: 'task-flows', value: null },
            ],
          },
        },
        { io: { input: documentLink(1) } },
      ],
    }

    expect(scanActivityForTaskRelations(activity)).toEqual([
      { collection: 'task-flows', id: 55 },
      { collection: 'task-lists', id: 9 },
    ])
  })

  test('answers nothing for an activity locale without blocks', () => {
    expect(scanActivityForTaskRelations({ blocks: null })).toEqual([])
  })
})

describe('scanTaskForDocumentIds', () => {
  test('scans the fields of the named collection', () => {
    expect(
      scanTaskForDocumentIds('task-flows', { blocks: [{ tools: { tools: documentLink(1) } }] }),
    ).toEqual([1])
    expect(scanTaskForDocumentIds('task-lists', { items: [{ topic: documentLink(2) }] })).toEqual([
      2,
    ])
  })
})

describe('scanActivityForDocumentIds', () => {
  // The endpoint reads the activity at depth 2, so a block relation carries the whole task with
  // its own `files` rows. Those rows hold no rich text, and the walk used to pass them by.
  test('finds the files and the rich text of a task a block names', () => {
    const activity = {
      blocks: [
        {
          blockType: 'activity-task',
          io: { input: documentLink(1) },
          relations: {
            tasks: [
              {
                relationTo: 'task-flows',
                value: {
                  blocks: [{ keypoints: { keypoints: documentLink(2) } }],
                  files: [{ document: { id: 7 } }],
                  id: 55,
                },
              },
            ],
          },
        },
      ],
      description: documentLink(3),
      files: [{ document: 4 }],
    }

    expect(ascending(scanActivityForDocumentIds(activity))).toEqual([1, 2, 3, 4, 7])
  })
})
