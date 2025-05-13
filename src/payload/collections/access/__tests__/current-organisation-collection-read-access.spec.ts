import { currentOrganisationCollectionReadAccess } from '../current-organisation-collection-read-access'
import { checkUserRoles } from '../../../utilities/check-user-roles'
import { getIdFromRelation } from '../../../utilities/get-id-from-relation'
import { ROLE_SUPER_ADMIN } from '../../../utilities/constants'

// Mock dependencies
jest.mock('../../../utilities/check-user-roles')
jest.mock('../../../utilities/get-id-from-relation')

describe('currentOrganisationCollectionReadAccess', () => {
  // Test data
  const mockOrgId = 123
  const mockSuperAdmin = {
    id: 1,
    email: 'admin@example.com',
    roles: [ROLE_SUPER_ADMIN],
    selectedOrganisation: null,
  }
  const mockRegularUser = {
    id: 2,
    email: 'user@example.com',
    selectedOrganisation: { id: mockOrgId },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should grant access when user is a super admin with no selected organisation', () => {
    // Setup mocks
    ;(getIdFromRelation as jest.Mock).mockReturnValue(null)
    ;(checkUserRoles as jest.Mock).mockReturnValue(true)

    // Call function with test data
    const result = currentOrganisationCollectionReadAccess({
      req: { user: mockSuperAdmin },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(null)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockSuperAdmin)
    expect(result).toBe(true)
  })

  test('should filter by selected organisation for regular users', () => {
    // Setup mocks
    ;(getIdFromRelation as jest.Mock).mockReturnValue(mockOrgId)

    // Call function with test data
    const result = currentOrganisationCollectionReadAccess({
      req: { user: mockRegularUser },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(mockRegularUser.selectedOrganisation)
    expect(result).toEqual({
      organisation: {
        equals: mockOrgId,
      },
    })
  })

  test('should filter by selected organisation even for super admin with selected org', () => {
    // Setup mocks
    const superAdminWithOrg = {
      ...mockSuperAdmin,
      selectedOrganisation: { id: mockOrgId },
    }

    ;(getIdFromRelation as jest.Mock).mockReturnValue(mockOrgId)

    // Call function with test data
    const result = currentOrganisationCollectionReadAccess({
      req: { user: superAdminWithOrg },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(superAdminWithOrg.selectedOrganisation)
    // Should not call checkUserRoles since user has selected org
    expect(checkUserRoles).not.toHaveBeenCalled()
    expect(result).toEqual({
      organisation: {
        equals: mockOrgId,
      },
    })
  })

  test('should handle users with no selectedOrganisation and not super admin', () => {
    // Setup mocks
    const regularUserNoOrg = {
      ...mockRegularUser,
      selectedOrganisation: null,
    }

    ;(getIdFromRelation as jest.Mock).mockReturnValue(null)
    ;(checkUserRoles as jest.Mock).mockReturnValue(false)

    // Call function with test data
    const result = currentOrganisationCollectionReadAccess({
      req: { user: regularUserNoOrg },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(null)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], regularUserNoOrg)
    // Should filter by null organisation since no org is selected and user is not admin
    expect(result).toEqual({
      organisation: {
        equals: null,
      },
    })
  })
})
