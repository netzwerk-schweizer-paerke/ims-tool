import type { PayloadRequest } from 'payload'

import { describe, expect, test, vi } from 'vitest'

import { attachTaskToBlock } from '@/payload/utilities/cloning/attach-task-to-block'

const TARGET_PARK = 19
const ACTIVITY_ID = 177

const taskBlock = (id: string) => ({ blockType: 'activity-task', id, relations: { tasks: [] } })

const makeReq = (blocksByLocale: Record<string, null | unknown[]>) => {
  const execute = vi.fn().mockResolvedValue(undefined)
  const findByID = vi.fn(async ({ locale }: { locale: string }) => ({
    blocks: blocksByLocale[locale] ?? null,
    id: ACTIVITY_ID,
  }))
  const update = vi.fn().mockResolvedValue({})
  const req = {
    context: {},
    payload: { db: { sessions: { 'tx-1': { db: { execute } } } }, findByID, update },
    transactionID: 'tx-1',
  } as unknown as PayloadRequest

  return { execute, findByID, req, update }
}

describe('attachTaskToBlock', () => {
  // The organisation hook keeps a Thema in its park only when the context names the park. A park
  // admin with another park selected would otherwise move the Thema into that park.
  test('writes every locale with the target park in the request context', async () => {
    const { req, update } = makeReq({ de: [taskBlock('d0')], fr: [taskBlock('f0')], it: null })

    const written = await attachTaskToBlock({
      cloneLocales: ['de', 'fr', 'it'],
      req,
      target: { activityId: ACTIVITY_ID, blockIndex: 0, organisationId: TARGET_PARK },
      task: { id: 9, relationTo: 'task-flows' },
    })

    expect(written).toBe(2)
    for (const [call] of update.mock.calls) {
      expect(call.req.context).toMatchObject({ targetOrganisationId: TARGET_PARK })
    }
  })

  test('takes the paste lock before it reads the Thema', async () => {
    const { execute, findByID, req } = makeReq({ de: [taskBlock('d0')] })

    await attachTaskToBlock({
      cloneLocales: ['de'],
      req,
      target: { activityId: ACTIVITY_ID, blockIndex: 0, organisationId: TARGET_PARK },
      task: { id: 9, relationTo: 'task-flows' },
    })

    expect(execute).toHaveBeenCalledTimes(1)
    expect(execute.mock.invocationCallOrder[0]).toBeLessThan(findByID.mock.invocationCallOrder[0])
  })

  test('refuses to run outside a transaction', async () => {
    const { req } = makeReq({ de: [taskBlock('d0')] })

    await expect(
      attachTaskToBlock({
        cloneLocales: ['de'],
        req: { ...req, transactionID: undefined } as PayloadRequest,
        target: { activityId: ACTIVITY_ID, blockIndex: 0, organisationId: TARGET_PARK },
        task: { id: 9, relationTo: 'task-flows' },
      }),
    ).rejects.toThrow('A paste must run inside a transaction')
  })
})
