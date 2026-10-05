import type { PayloadRequest } from 'payload'

import { describe, expect, test, vi } from 'vitest'

import { User } from '@/payload-types'
import { recordLastLoginAfterLoginHook } from '@/payload/collections/Users/hooks/record-last-login-after-login-hook'

type HookArgs = Parameters<typeof recordLastLoginAfterLoginHook>[0]

describe('recordLastLoginAfterLoginHook', () => {
  test('stamps one column through the adapter, inside the login transaction', async () => {
    const updateOne = vi.fn().mockResolvedValue(undefined)
    const update = vi.fn()
    const req = { payload: { db: { updateOne }, update }, transactionID: 'tx-login' }
    const user = { id: 42 } as User

    const before = Date.now()
    const result = await recordLastLoginAfterLoginHook({
      req: req as unknown as PayloadRequest,
      user,
    } as unknown as HookArgs)

    expect(result).toBe(user)
    // A Local API update runs validation and hooks. A throw there rolls back the new session.
    expect(update).not.toHaveBeenCalled()
    expect(updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'users', id: 42, req, returning: false }),
    )

    const stamped = Date.parse(updateOne.mock.calls[0][0].data.lastLoginAt)
    expect(stamped).toBeGreaterThanOrEqual(before)
    expect(Object.keys(updateOne.mock.calls[0][0].data)).toEqual(['lastLoginAt'])
  })
})
