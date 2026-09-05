import type { PayloadRequest, TypedLocale } from 'payload'

import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest'

import { ClonedTaskLookup, remapTaskLinks } from '@/payload/utilities/cloning/remap-task-links'

const CLONE_ID = 90
const SOURCE_TASK_ID = 42
const CLONED_TASK_ID = 99
const TARGET_ORG_ID = 6

/** A lexical internal link, in the shape the editor stores. */
const link = (relationTo: string, value: number, text = 'Reglement') => ({
  children: [{ text, type: 'text' }],
  fields: { doc: { label: text, relationTo, value }, linkType: 'internal' },
  type: 'link',
  version: 3,
})

const richText = (...nodes: unknown[]) => ({ root: { children: nodes, type: 'root' } })

const clonesTheTask: ClonedTaskLookup = (collection, sourceId) =>
  collection === 'task-flows' && sourceId === SOURCE_TASK_ID ? CLONED_TASK_ID : undefined

const clonesNothing: ClonedTaskLookup = () => undefined

let findByID: Mock
let update: Mock
let req: PayloadRequest

const givenStored = (stored: Record<string, unknown>) => {
  findByID.mockResolvedValue({ id: CLONE_ID, ...stored })
}

const run = (lookupClonedTask: ClonedTaskLookup, cloneLocales: TypedLocale[] = ['de']) =>
  remapTaskLinks({
    cloneLocales,
    lookupClonedTask,
    records: [{ collection: 'task-flows', id: CLONE_ID }],
    req,
    targetOrgId: TARGET_ORG_ID,
  })

const writtenChildren = () => update.mock.calls[0][0].data.description.root.children

beforeEach(() => {
  findByID = vi.fn()
  update = vi.fn().mockResolvedValue({})
  req = { context: {}, payload: { findByID, update } } as unknown as PayloadRequest
})

describe('remapTaskLinks', () => {
  test('points a task link at the clone of the task it names', async () => {
    givenStored({ description: richText(link('task-flows', SOURCE_TASK_ID)) })

    const totals = await run(clonesTheTask)

    expect(totals).toEqual({ degraded: 0, remapped: 1 })
    expect(writtenChildren()[0].fields.doc.value).toBe(CLONED_TASK_ID)
  })

  test('degrades a link to a task the run did not copy, and keeps its words', async () => {
    givenStored({ description: richText(link('task-flows', SOURCE_TASK_ID, 'Zertifizierung')) })

    const totals = await run(clonesNothing)

    expect(totals).toEqual({ degraded: 1, remapped: 0 })
    expect(writtenChildren()[0]).toMatchObject({ text: 'Zertifizierung', type: 'text' })
    expect(writtenChildren()[0].fields).toBeUndefined()
  })

  test('leaves a document link and a public document link untouched', async () => {
    givenStored({
      description: richText(link('documents', 7), link('documents-public', 8)),
    })

    const totals = await run(clonesNothing)

    expect(totals).toEqual({ degraded: 0, remapped: 0 })
    expect(update).not.toHaveBeenCalled()
  })

  test('reaches a link nested in a block, and never writes the files array back', async () => {
    givenStored({
      blocks: [
        { id: 'block-1', keypoints: { keypoints: richText(link('task-flows', SOURCE_TASK_ID)) } },
      ],
      files: [{ document: 5, id: 'row-1' }],
    })

    const totals = await run(clonesTheTask)

    expect(totals.remapped).toBe(1)
    const data = update.mock.calls[0][0].data
    const keypoints = data.blocks[0].keypoints.keypoints.root.children
    expect(keypoints[0].fields.doc.value).toBe(CLONED_TASK_ID)
    expect(data).not.toHaveProperty('files')
  })

  test('reads each locale with the fallback off and the access override on', async () => {
    givenStored({ description: richText(link('task-flows', SOURCE_TASK_ID)) })

    await run(clonesTheTask, ['de', 'fr', 'it'])

    expect(findByID).toHaveBeenCalledTimes(3)
    expect(findByID.mock.calls[0][0]).toMatchObject({
      depth: 0,
      fallbackLocale: false,
      locale: 'de',
      overrideAccess: true,
    })
    expect(update.mock.calls.map((call) => call[0].locale)).toEqual(['de', 'fr', 'it'])
  })

  test('writes nothing when the record holds no link at all', async () => {
    givenStored({ description: richText({ children: [{ text: 'Plain', type: 'text' }] }) })

    const totals = await run(clonesTheTask)

    expect(totals).toEqual({ degraded: 0, remapped: 0 })
    expect(update).not.toHaveBeenCalled()
  })
})
