import { beforeEach, describe, expect, test, vi } from 'vitest'

import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

import { currentOrganisationCollectionReadAccess } from './current-organisation-collection-read-access'

// Mock dependencies
vi.mock('@/payload/utilities/check-organisation-roles')
vi.mock('@/payload/utilities/check-user-roles')
vi.mock('@/payload/utilities/get-id-from-relation')

describe('currentOrganisationCollectionReadAccess', () => {
  // Test data
  const mockOrgId = 123
  const mockSuperAdmin = {
    email: 'admin@example.com',
    id: 1,
    roles: [ROLE_SUPER_ADMIN],
    selectedOrganisation: null,
  }
  const mockRegularUser = {
    email: 'user@example.com',
    id: 2,
    selectedOrganisation: { id: mockOrgId },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should grant access when user is a super admin with no selected organisation', () => {
    // Setup mocks
    vi.mocked(getIdFromRelation).mockReturnValue(null)
    vi.mocked(checkUserRoles).mockReturnValue(true)

    // Call function with test data
    const result = currentOrganisationCollectionReadAccess({
      req: { user: mockSuperAdmin },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(null)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockSuperAdmin)
    expect(result).toBe(true)
  })

  test('should filter by selected organisation for a member of that organisation', () => {
    // Setup mocks
    vi.mocked(getIdFromRelation).mockReturnValue(mockOrgId)
    vi.mocked(checkUserRoles).mockReturnValue(false)
    vi.mocked(checkOrganisationRoles).mockReturnValue(true)

    // Call function with test data
    const result = currentOrganisationCollectionReadAccess({
      req: { user: mockRegularUser },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(mockRegularUser.selectedOrganisation)
    expect(checkOrganisationRoles).toHaveBeenCalledWith(
      [ROLE_SUPER_ADMIN, ROLE_USER],
      mockRegularUser,
      mockOrgId,
    )
    expect(result).toEqual({
      organisation: {
        equals: mockOrgId,
      },
    })
  })

  test('should deny when the selected organisation is not one the user belongs to', () => {
    // Setup mocks
    vi.mocked(getIdFromRelation).mockReturnValue(mockOrgId)
    vi.mocked(checkUserRoles).mockReturnValue(false)
    vi.mocked(checkOrganisationRoles).mockReturnValue(false)

    // Call function with test data
    const result = currentOrganisationCollectionReadAccess({
      req: { user: mockRegularUser },
    } as any)

    // Assertions
    expect(result).toBe(false)
  })

  test('should filter by selected organisation even for super admin with selected org', () => {
    // Setup mocks
    const superAdminWithOrg = {
      ...mockSuperAdmin,
      selectedOrganisation: { id: mockOrgId },
    }

    vi.mocked(getIdFromRelation).mockReturnValue(mockOrgId)
    vi.mocked(checkUserRoles).mockReturnValue(true)

    // Call function with test data
    const result = currentOrganisationCollectionReadAccess({
      req: { user: superAdminWithOrg },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(superAdminWithOrg.selectedOrganisation)
    // A super admin needs no membership in the organisation they selected
    expect(checkOrganisationRoles).not.toHaveBeenCalled()
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

    vi.mocked(getIdFromRelation).mockReturnValue(null)
    vi.mocked(checkUserRoles).mockReturnValue(false)

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
