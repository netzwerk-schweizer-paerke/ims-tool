import type { CollectionBeforeChangeHook, PayloadRequest } from 'payload'

import { describe, expect, test, vi } from 'vitest'

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
import { enforceSelectedOrganisationMembershipHook } from '@/payload/collections/Users/hooks/enforce-selected-organisation-membership-hook'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { createMockUser, mockOrganisations } from '@/tests/mocks/test-utils'

const PARK = mockOrganisations.org1.id
const OTHER_PARK = mockOrganisations.org2.id

type HookArgs = Parameters<CollectionBeforeChangeHook<User>>[0]

const member: User = {
  ...createMockUser({ id: 9, selectedOrganisation: mockOrganisations.org1 }),
  organisations: [{ organisation: PARK, roles: [ROLE_USER] }],
}

const superAdmin: User = createMockUser({ id: 1, roles: [ROLE_SUPER_ADMIN] })

const makeReq = (user: null | User) => {
  const logger = { info: vi.fn(), warn: vi.fn() }
  const req = { payload: { logger }, user } as unknown as PayloadRequest

  return { logger, req }
}

const callHook = (
  data: Partial<User>,
  originalDoc: User,
  req: PayloadRequest,
): Partial<User> | Promise<Partial<User>> =>
  enforceSelectedOrganisationMembershipHook({
    context: {},
    data,
    operation: 'update',
    originalDoc,
    req,
  } as unknown as HookArgs)

/** The hook throws synchronously, so a rejection matcher never sees the error. */
const thrownBy = (run: () => unknown): unknown => {
  try {
    run()
  } catch (error) {
    return error
  }

  return null
}

describe('enforceSelectedOrganisationMembershipHook', () => {
  test('part 1: throws 403 when a member selects a park they do not belong to', () => {
    const { logger, req } = makeReq(member)

    expect(thrownBy(() => callHook({ selectedOrganisation: OTHER_PARK }, member, req))).toMatchObject({
      message: expect.stringContaining('not assigned'),
      status: 403,
    })
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  test('part 1: accepts a park the member belongs to', () => {
    const { req } = makeReq(member)
    const data = { selectedOrganisation: PARK }

    expect(callHook(data, { ...member, selectedOrganisation: null }, req)).toBe(data)
  })

  test('part 1: reads the memberships from the stored document, never from the request', () => {
    const { req } = makeReq(member)
    const forged: Partial<User> = {
      organisations: [{ organisation: OTHER_PARK, roles: [ROLE_USER] }],
      selectedOrganisation: OTHER_PARK,
    }

    expect(thrownBy(() => callHook(forged, member, req))).toMatchObject({ status: 403 })
  })

  test('lets a super admin caller choose any park for a member', () => {
    const { req } = makeReq(superAdmin)
    const data = { selectedOrganisation: OTHER_PARK }

    expect(callHook(data, member, req)).toBe(data)
  })

  test('applies neither part to a super admin target', () => {
    const { req } = makeReq(superAdmin)
    const data = { selectedOrganisation: OTHER_PARK }

    expect(callHook(data, superAdmin, req)).toBe(data)
  })

  test('passes a call with no req.user, because that is server code', () => {
    const { req } = makeReq(null)
    const data = { selectedOrganisation: OTHER_PARK }

    expect(callHook(data, member, req)).toBe(data)
  })

  test('part 3: moves the selection when the write removes its membership', () => {
    const { logger, req } = makeReq(superAdmin)
    const data: Partial<User> = {
      organisations: [{ organisation: OTHER_PARK, roles: [ROLE_USER] }],
    }

    const result = callHook(data, member, req)

    expect(result).toMatchObject({ selectedOrganisation: OTHER_PARK })
    expect(logger.info).toHaveBeenCalledTimes(1)
  })

  test('part 3: leaves the selection alone when the write keeps its membership', () => {
    const { logger, req } = makeReq(superAdmin)
    const data: Partial<User> = {
      organisations: [
        { organisation: PARK, roles: [ROLE_USER] },
        { organisation: OTHER_PARK, roles: [ROLE_USER] },
      ],
    }

    const result = callHook(data, member, req)

    expect(result).not.toHaveProperty('selectedOrganisation')
    expect(logger.info).not.toHaveBeenCalled()
  })

  test('part 3: leaves the selection alone when the write removes every membership', () => {
    const { req } = makeReq(superAdmin)
    const data: Partial<User> = { organisations: [] }

    expect(callHook(data, member, req)).not.toHaveProperty('selectedOrganisation')
  })

  test('accepts a null selection from a member; the read rule then answers nothing', () => {
    // The choice is recorded in decisions/selected-organisation-needs-a-membership-check. The
    // account page can clear the field, and a 403 there would strand the user on an error.
    const { req } = makeReq(member)
    const data = { selectedOrganisation: null }

    expect(callHook(data, member, req)).toBe(data)
  })
})
