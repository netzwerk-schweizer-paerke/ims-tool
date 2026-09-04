import type { CollectionBeforeChangeHook, PayloadRequest } from 'payload'

import { describe, expect, type Mock, test, vi } from 'vitest'

// `checkUserRoles` imports tslog. The stub keeps the logger out of the run.
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

// The hook imports `APIError` at run time. The stub keeps the message and the status, which is
// what the tests assert, and it keeps the whole payload package out of the run.
vi.mock('payload', () => ({
  APIError: class extends Error {
    status: number

    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

import { User } from '@/payload-types'
import { stampShareLinkHook } from '@/payload/collections/ShareLinks/hooks/stamp-share-link-hook'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { createMockUser, mockOrganisations } from '@/tests/mocks/test-utils'

const PARK = mockOrganisations.org1.id
const OTHER_PARK = mockOrganisations.org2.id

type HookArgs = Parameters<CollectionBeforeChangeHook>[0]
type HookResult = Record<string, unknown>

const member: User = {
  ...createMockUser({ id: 9, selectedOrganisation: mockOrganisations.org1 }),
  organisations: [{ organisation: PARK, roles: [ROLE_USER] }],
}

const makeReq = (user: null | User, find: Mock): PayloadRequest =>
  ({ payload: { find }, user }) as unknown as PayloadRequest

const callHook = async (
  data: Record<string, unknown>,
  req: PayloadRequest,
  operation: 'create' | 'update' = 'create',
): Promise<HookResult> =>
  (await stampShareLinkHook({
    context: {},
    data,
    operation,
    req,
  } as unknown as HookArgs)) as HookResult

const findReturning = (docs: unknown[]) => vi.fn().mockResolvedValue({ docs })

describe('stampShareLinkHook', () => {
  test('leaves an update untouched', async () => {
    const find = findReturning([])
    const data = { targetType: 'flow', taskFlow: 42 }

    expect(await callHook(data, makeReq(member, find), 'update')).toBe(data)
    expect(find).not.toHaveBeenCalled()
  })

  test('refuses a create with no authenticated user', async () => {
    await expect(
      callHook({ targetType: 'flow', taskFlow: 42 }, makeReq(null, findReturning([]))),
    ).rejects.toMatchObject({ message: expect.stringContaining('authenticated creator'), status: 401 })
  })

  test('refuses a target that names no page', async () => {
    await expect(
      callHook({ targetType: 'flow' }, makeReq(member, findReturning([]))),
    ).rejects.toMatchObject({ status: 400 })
  })

  test('refuses a target the caller cannot read', async () => {
    await expect(
      callHook({ targetType: 'flow', taskFlow: 42 }, makeReq(member, findReturning([]))),
    ).rejects.toMatchObject({ status: 403 })
  })

  test('resolves a flow with the caller access, never with an override', async () => {
    const find = findReturning([{ id: 42, organisation: PARK }])

    await callHook({ targetType: 'flow', taskFlow: 42 }, makeReq(member, find))

    expect(find).toHaveBeenCalledTimes(1)
    expect(find.mock.calls[0][0]).toMatchObject({
      collection: 'task-flows',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      user: member,
      where: { id: { equals: 42 } },
    })
  })

  test('stamps the organisation of the resolved record, not one the client sent', async () => {
    const find = findReturning([{ id: 42, organisation: PARK }])

    const result = await callHook(
      { organisation: OTHER_PARK, targetType: 'flow', taskFlow: 42 },
      makeReq(member, find),
    )

    expect(result.organisation).toBe(PARK)
  })

  test('stamps the creator from the request, never from the body', async () => {
    const find = findReturning([{ id: 42, organisation: PARK }])

    const result = await callHook(
      { createdBy: 999, targetType: 'flow', taskFlow: 42 },
      makeReq(member, find),
    )

    expect(result.createdBy).toBe(9)
  })

  test('replaces a client-supplied token with a generated one', async () => {
    const find = findReturning([{ id: 42, organisation: PARK }])

    const result = await callHook(
      { targetType: 'flow', taskFlow: 42, token: 'chosen-by-the-client' },
      makeReq(member, find),
    )

    expect(result.token).not.toBe('chosen-by-the-client')
    expect(result.token).toMatch(/^[\w-]{20,}$/)
  })

  test('generates a different token on every create', async () => {
    const find = findReturning([{ id: 42, organisation: PARK }])
    const data = { targetType: 'flow', taskFlow: 42 }

    const first = await callHook({ ...data }, makeReq(member, find))
    const second = await callHook({ ...data }, makeReq(member, find))

    expect(first.token).not.toBe(second.token)
  })

  test('resolves an activity block through the activities collection', async () => {
    const find = findReturning([{ id: 12, organisation: PARK }])

    const result = await callHook(
      { activity: 12, blockId: 'block-1', targetType: 'activityBlock' },
      makeReq(member, find),
    )

    expect(find.mock.calls[0][0]).toMatchObject({ collection: 'activities' })
    expect(result.organisation).toBe(PARK)
  })

  test('takes the landscape organisation from a park the caller belongs to', async () => {
    const find = findReturning([])

    const result = await callHook({ targetType: 'activityLandscape' }, makeReq(member, find))

    expect(result.organisation).toBe(PARK)
    expect(find).not.toHaveBeenCalled()
  })

  test('refuses a landscape link for a park the caller does not belong to', async () => {
    const impostor: User = {
      ...createMockUser({ id: 10, selectedOrganisation: mockOrganisations.org1 }),
      organisations: [{ organisation: OTHER_PARK, roles: [ROLE_USER] }],
    }

    await expect(
      callHook({ targetType: 'activityLandscape' }, makeReq(impostor, findReturning([]))),
    ).rejects.toMatchObject({ status: 403 })
  })

  test('lets a super admin share the landscape of the park they selected', async () => {
    const superAdmin: User = createMockUser({
      id: 1,
      roles: [ROLE_SUPER_ADMIN],
      selectedOrganisation: mockOrganisations.org1,
    })

    const result = await callHook(
      { targetType: 'activityLandscape' },
      makeReq(superAdmin, findReturning([])),
    )

    expect(result.organisation).toBe(PARK)
  })
})
