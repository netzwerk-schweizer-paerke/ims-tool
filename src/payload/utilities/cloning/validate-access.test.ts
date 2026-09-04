import type { PayloadRequest } from 'payload'

import { describe, expect, test, vi } from 'vitest'

// `checkUserRoles` imports tslog. The stub keeps the logger out of the run.
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import { User } from '@/payload-types'
import { validateCloneAccess } from '@/payload/utilities/cloning/validate-access'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { createMockUser, mockOrganisations } from '@/tests/mocks/test-utils'

const SOURCE_PARK = mockOrganisations.org1.id
const TARGET_PARK = mockOrganisations.org2.id
const SOURCE_ID = 7

const makeReq = (source: null | Record<string, unknown>) => {
  const findByID = vi.fn().mockResolvedValue(source)
  const logger = { warn: vi.fn() }
  const req = { payload: { findByID, logger } } as unknown as PayloadRequest

  return { findByID, logger, req }
}

const withMemberships = (memberships: User['organisations']): User => ({
  ...createMockUser({ id: 9, selectedOrganisation: mockOrganisations.org1 }),
  organisations: memberships,
})

const readerOfSourceAndAdminOfTarget = withMemberships([
  { organisation: SOURCE_PARK, roles: [ROLE_USER] },
  { organisation: TARGET_PARK, roles: [ROLE_SUPER_ADMIN] },
])

const run = (req: PayloadRequest, user: null | User) =>
  validateCloneAccess({
    collectionSlug: 'task-flows',
    req,
    sourceId: SOURCE_ID,
    targetOrgId: TARGET_PARK,
    user,
  })

describe('validateCloneAccess', () => {
  test('reads the source inside the caller request, with an explicit override', async () => {
    const { findByID, req } = makeReq({ id: SOURCE_ID, organisation: SOURCE_PARK })

    await run(req, readerOfSourceAndAdminOfTarget)

    // This function is the access gate. The caller's own read filter would strip `organisation`
    // for a member who is not an admin of the source park, so the read is unchecked on purpose,
    // and the role checks below it are the bound. A unit test cannot observe a transaction, so
    // it asserts the option.
    expect(findByID).toHaveBeenCalledTimes(1)
    expect(findByID.mock.calls[0][0]).toMatchObject({
      collection: 'task-flows',
      depth: 0,
      id: SOURCE_ID,
      overrideAccess: true,
      req,
    })
  })

  test('answers 401 with no user, and reads nothing', async () => {
    const { findByID, req } = makeReq(null)

    expect(await run(req, null)).toEqual({
      error: { message: 'User not authenticated', status: 401 },
      isValid: false,
    })
    expect(findByID).not.toHaveBeenCalled()
  })

  test('passes a super admin without a read', async () => {
    const { findByID, req } = makeReq(null)

    expect(await run(req, createMockUser({ id: 1, roles: [ROLE_SUPER_ADMIN] }))).toEqual({
      isValid: true,
    })
    expect(findByID).not.toHaveBeenCalled()
  })

  test('passes a reader of the source park who is an admin of the target park', async () => {
    const { req } = makeReq({ id: SOURCE_ID, organisation: SOURCE_PARK })

    expect(await run(req, readerOfSourceAndAdminOfTarget)).toEqual({ isValid: true })
  })

  test('accepts a populated organisation on the source', async () => {
    const { req } = makeReq({ id: SOURCE_ID, organisation: mockOrganisations.org1 })

    expect(await run(req, readerOfSourceAndAdminOfTarget)).toEqual({ isValid: true })
  })

  test('refuses a caller who is not a member of the source park', async () => {
    const { logger, req } = makeReq({ id: SOURCE_ID, organisation: SOURCE_PARK })
    const adminOfTargetOnly = withMemberships([
      { organisation: TARGET_PARK, roles: [ROLE_SUPER_ADMIN] },
    ])

    expect(await run(req, adminOfTargetOnly)).toMatchObject({
      error: { message: expect.stringContaining('source organization'), status: 403 },
      isValid: false,
    })
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  test('refuses a caller who is not an admin of the target park', async () => {
    const { req } = makeReq({ id: SOURCE_ID, organisation: SOURCE_PARK })
    const readerOfBoth = withMemberships([
      { organisation: SOURCE_PARK, roles: [ROLE_USER] },
      { organisation: TARGET_PARK, roles: [ROLE_USER] },
    ])

    expect(await run(req, readerOfBoth)).toMatchObject({
      error: { message: expect.stringContaining('target organization'), status: 403 },
      isValid: false,
    })
  })

  test('refuses a source that carries no organisation', async () => {
    const { req } = makeReq({ id: SOURCE_ID, organisation: null })

    expect(await run(req, readerOfSourceAndAdminOfTarget)).toMatchObject({
      error: { status: 403 },
      isValid: false,
    })
  })
})
