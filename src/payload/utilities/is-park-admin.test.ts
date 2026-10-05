import { describe, expect, test, vi } from 'vitest'

// The role checks import tslog. The stub keeps the logger out of the run.
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import { User } from '@/payload-types'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { administeredOrganisationId, isParkAdmin } from '@/payload/utilities/is-park-admin'
import { createMockUser, mockOrganisations } from '@/tests/mocks/test-utils'

const PARK = mockOrganisations.org1.id
const OTHER_PARK = mockOrganisations.org2.id

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

describe('administeredOrganisationId', () => {
  test('returns the park a park admin administers', () => {
    expect(administeredOrganisationId(parkAdmin)).toBe(PARK)
  })

  test('returns null for a member who is not a park admin', () => {
    expect(administeredOrganisationId(parkMember)).toBeNull()
  })

  test('returns null when the selected park is not one the user belongs to', () => {
    expect(administeredOrganisationId(impostor)).toBeNull()
  })

  test('returns null when no park is selected', () => {
    expect(administeredOrganisationId(createMockUser({ id: 5 }))).toBeNull()
  })

  test('returns null for an anonymous caller', () => {
    expect(administeredOrganisationId(null)).toBeNull()
  })
})

describe('isParkAdmin', () => {
  test('admits a super admin', () => {
    expect(isParkAdmin(superAdmin)).toBe(true)
  })

  test('admits a park admin', () => {
    expect(isParkAdmin(parkAdmin)).toBe(true)
  })

  test('refuses a plain member', () => {
    expect(isParkAdmin(parkMember)).toBe(false)
  })

  test('refuses an admin of another park', () => {
    expect(isParkAdmin(impostor)).toBe(false)
  })

  test('refuses an anonymous caller', () => {
    expect(isParkAdmin(null)).toBe(false)
  })
})
