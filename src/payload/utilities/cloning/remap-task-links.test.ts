import type { PayloadRequest, TypedLocale } from 'payload'

import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest'

import { ClonedTaskLookup, remapTaskLinks } from '@/payload/utilities/cloning/remap-task-links'

const CLONE_ID = 90
const SOURCE_TASK_ID = 42
const CLONED_TASK_ID = 99
const TARGET_ORG_ID = 6
const OTHER_ORG_ID = 17

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
let stored: Record<string, unknown>
let linkedTask: Record<string, unknown>

const givenStored = (fields: Record<string, unknown>) => {
  stored = { id: CLONE_ID, ...fields }
}

/** The task the link names. It lives outside the target park unless a test says otherwise. */
const givenLinkedTask = (task: Record<string, unknown>) => {
  linkedTask = task
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
  givenStored({})
  givenLinkedTask({ id: SOURCE_TASK_ID, name: 'Reglement des Parks', organisation: OTHER_ORG_ID })
  // The record read names the clone. Every other read resolves the task a link names.
  findByID = vi.fn(async ({ id }: { id: number }) => (id === CLONE_ID ? stored : linkedTask))
  update = vi.fn().mockResolvedValue({})
  req = { context: {}, payload: { findByID, update } } as unknown as PayloadRequest
})

describe('remapTaskLinks', () => {
  test('points a task link at the clone of the task it names', async () => {
    givenStored({ description: richText(link('task-flows', SOURCE_TASK_ID)) })

    const totals = await run(clonesTheTask)

    expect(totals).toMatchObject({ degraded: 0, kept: 0, remapped: 1 })
    expect(writtenChildren()[0].fields.doc.value).toBe(CLONED_TASK_ID)
  })

  test('keeps a link the run did not copy when the target park owns the task', async () => {
    givenStored({ description: richText(link('task-flows', SOURCE_TASK_ID)) })
    givenLinkedTask({ id: SOURCE_TASK_ID, name: 'Reglement', organisation: TARGET_ORG_ID })

    const totals = await run(clonesNothing)

    expect(totals).toMatchObject({ degraded: 0, dropped: [], kept: 1, remapped: 0 })
    expect(update).not.toHaveBeenCalled()
  })

  test('reads the owner through a populated relation as well', async () => {
    givenStored({ description: richText(link('task-flows', SOURCE_TASK_ID)) })
    givenLinkedTask({
      id: SOURCE_TASK_ID,
      name: 'Reglement',
      organisation: { id: TARGET_ORG_ID, name: 'Feature Test Park' },
    })

    expect(await run(clonesNothing)).toMatchObject({ kept: 1 })
  })

  test('degrades a link that leaves the park, keeps its words and names it', async () => {
    givenStored({ description: richText(link('task-flows', SOURCE_TASK_ID, 'Zertifizierung')) })

    const totals = await run(clonesNothing)

    expect(totals).toMatchObject({ degraded: 1, kept: 0, remapped: 0 })
    expect(totals.dropped).toEqual([
      { collection: 'task-flows', name: 'Reglement des Parks', sourceId: SOURCE_TASK_ID },
    ])
    expect(writtenChildren()[0]).toMatchObject({ text: 'Zertifizierung', type: 'text' })
    expect(writtenChildren()[0].fields).toBeUndefined()
  })

  test('degrades a link whose task no longer exists', async () => {
    givenStored({ description: richText(link('task-flows', SOURCE_TASK_ID)) })
    findByID = vi.fn(async ({ id }: { id: number }) => {
      if (id === CLONE_ID) return stored
      throw new Error('NotFound')
    })
    req = { context: {}, payload: { findByID, update } } as unknown as PayloadRequest

    expect(await run(clonesNothing)).toMatchObject({ degraded: 1 })
  })

  test('leaves a document link and a public document link untouched', async () => {
    givenStored({ description: richText(link('documents', 7), link('documents-public', 8)) })

    const totals = await run(clonesNothing)

    expect(totals).toMatchObject({ degraded: 0, kept: 0, remapped: 0 })
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

  test('decides one target once, however many locales and links name it', async () => {
    givenStored({
      description: richText(
        link('task-flows', SOURCE_TASK_ID),
        link('task-flows', SOURCE_TASK_ID),
      ),
    })

    const totals = await run(clonesNothing, ['de', 'fr', 'it'])

    // Three locales hold two links each. The owner read and the count both run once.
    expect(totals.degraded).toBe(1)
    expect(findByID.mock.calls.filter((call) => call[0].id === SOURCE_TASK_ID)).toHaveLength(1)
    expect(update.mock.calls.map((call) => call[0].locale)).toEqual(['de', 'fr', 'it'])
  })

  test('reads each locale with the fallback off and the access override on', async () => {
    givenStored({ description: richText(link('task-flows', SOURCE_TASK_ID)) })

    await run(clonesTheTask, ['de', 'fr'])

    expect(findByID.mock.calls[0][0]).toMatchObject({
      depth: 0,
      fallbackLocale: false,
      locale: 'de',
      overrideAccess: true,
    })
  })

  test('writes nothing when the record holds no link at all', async () => {
    givenStored({ description: richText({ children: [{ text: 'Plain', type: 'text' }] }) })

    const totals = await run(clonesTheTask)

    expect(totals).toMatchObject({ degraded: 0, kept: 0, remapped: 0 })
    expect(update).not.toHaveBeenCalled()
  })
})
