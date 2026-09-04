import { beforeEach, describe, expect, test, vi } from 'vitest'

import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { mockOrganisations, mockUsers } from '@/tests/mocks/test-utils'

import { organisationCollectionReadAccess } from './organisation-collection-read-access'

// Mock dependencies
vi.mock('@/payload/utilities/check-user-roles')
vi.mock('@/payload/utilities/check-organisation-roles')
vi.mock('@/payload/utilities/get-id-from-relation')

// The real helper takes `unknown`, so the mock narrows the same way it does.
const idOfRelation = (relation: unknown): null | number => {
  if (typeof relation === 'number') return relation
  if (typeof relation === 'object' && relation !== null && 'id' in relation) {
    return typeof relation.id === 'number' ? relation.id : null
  }
  return null
}

describe('organisationCollectionReadAccess', () => {
  // Test data
  const mockPayload = {
    logger: { debug: vi.fn() },
  }

  // Create test users with custom organisation setup
  const userWithMultipleOrgs = {
    ...mockUsers.regularUser,
    organisations: [
      { organisation: { id: mockOrganisations.org1.id }, roles: [ROLE_USER] },
      { organisation: { id: mockOrganisations.org2.id }, roles: [ROLE_SUPER_ADMIN, ROLE_USER] },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset all mocks
    vi.mocked(checkUserRoles).mockReset()
    vi.mocked(checkOrganisationRoles).mockReset()
    vi.mocked(getIdFromRelation).mockReset()
  })

  test('should grant full access when user is a super admin', () => {
    // Setup mocks
    vi.mocked(checkUserRoles).mockReturnValue(true)

    // Call function with test data
    const result = organisationCollectionReadAccess({
      req: {
        payload: mockPayload,
        user: mockUsers.admin,
      },
    } as any)

    // Assertions
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUsers.admin)
    expect(mockPayload.logger.debug).toHaveBeenCalled()
    expect(result).toBe(true)
    // Should not check organization roles for super admin
    expect(checkOrganisationRoles).not.toHaveBeenCalled()
  })

  test('should return filtered access for user with organization roles', () => {
    // Setup mocks
    vi.mocked(checkUserRoles).mockReturnValue(false)
    // Simulate that the user has proper roles in both organizations
    vi.mocked(checkOrganisationRoles).mockReturnValue(true)
    vi.mocked(getIdFromRelation).mockImplementation(idOfRelation)

    // Call function with test data
    const result = organisationCollectionReadAccess({
      req: {
        payload: mockPayload,
        user: userWithMultipleOrgs,
      },
    } as any)

    // Assertions
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], userWithMultipleOrgs)
    expect(checkOrganisationRoles).toHaveBeenCalledTimes(2)
    expect(getIdFromRelation).toHaveBeenCalledTimes(4) // Called for organization lookups
    expect(result).toEqual({
      id: {
        in: [mockOrganisations.org1.id, mockOrganisations.org2.id],
      },
    })
  })

  test('should filter organizations based on user roles', () => {
    // Setup mocks
    vi.mocked(checkUserRoles).mockReturnValue(false)
    vi.mocked(checkOrganisationRoles).mockImplementation((roles, user, orgId) => {
      // Simulate that user only has proper roles in the second organization
      return orgId === mockOrganisations.org2.id
    })
    vi.mocked(getIdFromRelation).mockImplementation(idOfRelation)

    // Call function with test data
    const result = organisationCollectionReadAccess({
      req: {
        payload: mockPayload,
        user: userWithMultipleOrgs,
      },
    } as any)

    // Assertions
    expect(checkOrganisationRoles).toHaveBeenCalledTimes(2)
    expect(result).toEqual({
      id: {
        in: [mockOrganisations.org2.id],
      },
    })
  })

  test('should return false when user has no accessible organizations', () => {
    // Setup mocks
    vi.mocked(checkUserRoles).mockReturnValue(false)

    // Call function with test data
    const result = organisationCollectionReadAccess({
      req: {
        payload: mockPayload,
        user: mockUsers.noRolesUser,
      },
    } as any)

    // Assertions
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUsers.noRolesUser)
    expect(mockPayload.logger.debug).toHaveBeenCalled()
    expect(result).toBe(false)
  })

  test('should return false when user has organizations but none are accessible', () => {
    // Setup mocks
    vi.mocked(checkUserRoles).mockReturnValue(false)
    vi.mocked(checkOrganisationRoles).mockReturnValue(false) // No orgs accessible
    vi.mocked(getIdFromRelation).mockImplementation(idOfRelation)

    // Call function with test data
    const result = organisationCollectionReadAccess({
      req: {
        payload: mockPayload,
        user: userWithMultipleOrgs,
      },
    } as any)

    // Assertions
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], userWithMultipleOrgs)
    expect(checkOrganisationRoles).toHaveBeenCalledTimes(2)
    expect(mockPayload.logger.debug).toHaveBeenCalled()
    expect(result).toBe(false)
  })
})
