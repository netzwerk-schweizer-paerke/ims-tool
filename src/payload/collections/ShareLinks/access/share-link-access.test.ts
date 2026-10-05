import type { Access } from 'payload'

import { describe, expect, test, vi } from 'vitest'

// The access rules reach `checkUserRoles`, which imports tslog. The stub keeps the logger out of
// the run, so the real rule logic stays under test.
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import { User } from '@/payload-types'
import {
  shareLinkAdminAccess,
  shareLinkCreateAccess,
  shareLinkOwnerOrAdminAccess,
} from '@/payload/collections/ShareLinks/access/share-link-access'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { createMockUser, mockOrganisations } from '@/tests/mocks/test-utils'

const PARK = mockOrganisations.org1.id
const OTHER_PARK = mockOrganisations.org2.id

const callAccess = (access: Access, user: null | User) =>
  access({ req: { user } } as unknown as Parameters<Access>[0])

const superAdmin = createMockUser({ id: 1, roles: [ROLE_SUPER_ADMIN] })

const parkAdmin: User = {
  ...createMockUser({ id: 2, selectedOrganisation: mockOrganisations.org1 }),
  organisations: [{ organisation: PARK, roles: [ROLE_SUPER_ADMIN] }],
}

const parkMember: User = {
  ...createMockUser({ id: 3, selectedOrganisation: mockOrganisations.org1 }),
  organisations: [{ organisation: PARK, roles: [ROLE_USER] }],
}

// The stored selection alone never proves membership, because its owner can write it.
const impostor: User = {
  ...createMockUser({ id: 4, selectedOrganisation: mockOrganisations.org1 }),
  organisations: [{ organisation: OTHER_PARK, roles: [ROLE_SUPER_ADMIN] }],
}

describe('shareLinkCreateAccess', () => {
  test('admits a super admin', () => {
    expect(callAccess(shareLinkCreateAccess, superAdmin)).toBe(true)
  })

  test('admits a park admin', () => {
    expect(callAccess(shareLinkCreateAccess, parkAdmin)).toBe(true)
  })

  test('refuses a reader', () => {
    expect(callAccess(shareLinkCreateAccess, parkMember)).toBe(false)
  })

  test('refuses an admin of another park', () => {
    expect(callAccess(shareLinkCreateAccess, impostor)).toBe(false)
  })

  test('refuses an anonymous caller', () => {
    expect(callAccess(shareLinkCreateAccess, null)).toBe(false)
  })
})

describe('shareLinkOwnerOrAdminAccess', () => {
  test('refuses an anonymous caller', () => {
    expect(callAccess(shareLinkOwnerOrAdminAccess, null)).toBe(false)
  })

  test('grants a super admin every row', () => {
    expect(callAccess(shareLinkOwnerOrAdminAccess, superAdmin)).toBe(true)
  })

  test('grants a park admin their own rows and their park', () => {
    expect(callAccess(shareLinkOwnerOrAdminAccess, parkAdmin)).toEqual({
      or: [{ createdBy: { equals: 2 } }, { organisation: { equals: PARK } }],
    })
  })

  test('limits a plain member to the rows they created', () => {
    expect(callAccess(shareLinkOwnerOrAdminAccess, parkMember)).toEqual({
      createdBy: { equals: 3 },
    })
  })

  test('limits an impostor to their own rows, never to the selected park', () => {
    expect(callAccess(shareLinkOwnerOrAdminAccess, impostor)).toEqual({
      createdBy: { equals: 4 },
    })
  })
})

describe('shareLinkAdminAccess', () => {
  test('refuses an anonymous caller', () => {
    expect(callAccess(shareLinkAdminAccess, null)).toBe(false)
  })

  test('grants a super admin every row', () => {
    expect(callAccess(shareLinkAdminAccess, superAdmin)).toBe(true)
  })

  test('limits a park admin to their park', () => {
    expect(callAccess(shareLinkAdminAccess, parkAdmin)).toEqual({
      organisation: { equals: PARK },
    })
  })

  test('refuses a plain member, who may still delete their own row', () => {
    expect(callAccess(shareLinkAdminAccess, parkMember)).toBe(false)
  })

  test('refuses an impostor', () => {
    expect(callAccess(shareLinkAdminAccess, impostor)).toBe(false)
  })
})
