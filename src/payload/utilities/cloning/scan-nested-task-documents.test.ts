import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, test, vi } from 'vitest'

import { scanNestedTaskDocumentIds } from './scan-nested-task-documents'

const TASK_FLOW_ID = 55
const TASK_LIST_ID = 9
const KEYPOINT_DOCUMENT_ID = 812
const FILE_DOCUMENT_ID = 243

const documentLink = (documentId: number) => ({
  root: {
    children: [
      {
        children: [
          { fields: { doc: { relationTo: 'documents', value: documentId } }, type: 'link' },
        ],
        type: 'paragraph',
      },
    ],
    type: 'root',
  },
})

const activityDe = {
  blocks: [
    {
      relations: {
        tasks: [
          { relationTo: 'task-flows', value: { id: TASK_FLOW_ID } },
          { relationTo: 'task-lists', value: TASK_LIST_ID },
        ],
      },
    },
  ],
}

/** A locale the activity never got answers with `blocks: null` under `fallbackLocale: false`. */
const activityFr = { blocks: null }

// The Italian keypoints of the task flow link a document that no activity locale reaches.
const findByID = vi
  .fn()
  .mockImplementation(
    async ({ collection, id, locale }: { collection: string; id: number; locale: string }) => {
      if (collection === 'task-flows' && id === TASK_FLOW_ID && locale === 'it') {
        return { blocks: [{ keypoints: { keypoints: documentLink(KEYPOINT_DOCUMENT_ID) } }], id }
      }

      if (collection === 'task-lists' && id === TASK_LIST_ID && locale === 'de') {
        return { files: [{ document: FILE_DOCUMENT_ID }], id }
      }

      return { id }
    },
  )

const req = { payload: { findByID } } as unknown as PayloadRequest

beforeEach(() => {
  vi.clearAllMocks()
})

describe('scanNestedTaskDocumentIds', () => {
  test('reads every locale of every named task, once per task', async () => {
    const ids = await scanNestedTaskDocumentIds(
      req,
      [activityDe, activityFr, activityDe],
      ['de', 'fr', 'it'],
    )

    expect([...ids].sort((a, b) => a - b)).toEqual([FILE_DOCUMENT_ID, KEYPOINT_DOCUMENT_ID])
    expect(findByID).toHaveBeenCalledTimes(6)
    expect(findByID).toHaveBeenCalledWith({
      collection: 'task-flows',
      depth: 0,
      fallbackLocale: false,
      id: TASK_FLOW_ID,
      locale: 'it',
      req,
    })
  })

  test('reads nothing when no block names a task', async () => {
    const ids = await scanNestedTaskDocumentIds(req, [activityFr], ['de', 'fr'])

    expect(ids).toEqual([])
    expect(findByID).not.toHaveBeenCalled()
  })
})
