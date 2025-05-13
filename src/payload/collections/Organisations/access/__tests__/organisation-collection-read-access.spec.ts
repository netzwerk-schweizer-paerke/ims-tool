import { organisationCollectionReadAccess } from '../organisation-collection-read-access'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { mockOrganisations, mockUsers } from '@/tests/mocks/test-utils'

// Mock dependencies
jest.mock('../../../../utilities/check-user-roles')
jest.mock('../../../../utilities/check-organisation-roles')
jest.mock('../../../../utilities/get-id-from-relation')

describe('organisationCollectionReadAccess', () => {
  // Test data
  const mockPayload = {
    logger: { debug: jest.fn() },
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
    jest.clearAllMocks()
    // Reset all mocks
    jest.mocked(checkUserRoles).mockReset()
    jest.mocked(checkOrganisationRoles).mockReset()
    jest.mocked(getIdFromRelation).mockReset()
  })

  test('should grant full access when user is a super admin', () => {
    // Setup mocks
    jest.mocked(checkUserRoles).mockReturnValue(true)

    // Call function with test data
    const result = organisationCollectionReadAccess({
      req: {
        user: mockUsers.admin,
        payload: mockPayload,
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
    jest.mocked(checkUserRoles).mockReturnValue(false)
    jest.mocked(checkOrganisationRoles).mockImplementation((roles, user, orgId) => {
      // Simulate that user has proper roles in both organizations
      return true
    })
    jest.mocked(getIdFromRelation).mockImplementation((relation) => {
      if (typeof relation === 'number') return relation
      if (relation?.id === mockOrganisations.org1.id) return mockOrganisations.org1.id
      if (relation?.id === mockOrganisations.org2.id) return mockOrganisations.org2.id
      return null
    })

    // Call function with test data
    const result = organisationCollectionReadAccess({
      req: {
        user: userWithMultipleOrgs,
        payload: mockPayload,
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
    jest.mocked(checkUserRoles).mockReturnValue(false)
    jest.mocked(checkOrganisationRoles).mockImplementation((roles, user, orgId) => {
      // Simulate that user only has proper roles in the second organization
      return orgId === mockOrganisations.org2.id
    })
    jest.mocked(getIdFromRelation).mockImplementation((relation) => {
      if (typeof relation === 'number') return relation
      if (relation?.id === mockOrganisations.org1.id) return mockOrganisations.org1.id
      if (relation?.id === mockOrganisations.org2.id) return mockOrganisations.org2.id
      return null
    })

    // Call function with test data
    const result = organisationCollectionReadAccess({
      req: {
        user: userWithMultipleOrgs,
        payload: mockPayload,
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
    jest.mocked(checkUserRoles).mockReturnValue(false)

    // Call function with test data
    const result = organisationCollectionReadAccess({
      req: {
        user: mockUsers.noRolesUser,
        payload: mockPayload,
      },
    } as any)

    // Assertions
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUsers.noRolesUser)
    expect(mockPayload.logger.debug).toHaveBeenCalled()
    expect(result).toBe(false)
  })

  test('should return false when user has organizations but none are accessible', () => {
    // Setup mocks
    jest.mocked(checkUserRoles).mockReturnValue(false)
    jest.mocked(checkOrganisationRoles).mockReturnValue(false) // No orgs accessible
    jest.mocked(getIdFromRelation).mockImplementation((relation) => {
      if (typeof relation === 'number') return relation
      if (relation?.id === mockOrganisations.org1.id) return mockOrganisations.org1.id
      if (relation?.id === mockOrganisations.org2.id) return mockOrganisations.org2.id
      return null
    })

    // Call function with test data
    const result = organisationCollectionReadAccess({
      req: {
        user: userWithMultipleOrgs,
        payload: mockPayload,
      },
    } as any)

    // Assertions
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], userWithMultipleOrgs)
    expect(checkOrganisationRoles).toHaveBeenCalledTimes(2)
    expect(mockPayload.logger.debug).toHaveBeenCalled()
    expect(result).toBe(false)
  })
})
