import { beforeEach, describe, expect, test, vi } from 'vitest'

import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { mockOrganisations, mockUsers } from '@/tests/mocks/test-utils'

import { currentOrganisationCollectionWriteAccess } from './current-organisation-collection-write-access'

// Mock dependencies
vi.mock('@/payload/utilities/check-user-roles')
vi.mock('@/payload/utilities/check-organisation-roles')
vi.mock('@/payload/utilities/get-id-from-relation')

describe('currentOrganisationCollectionWriteAccess', () => {
  // Test data
  const mockOrgId = mockOrganisations.org1.id
  const mockPayload = {
    findByID: vi.fn(),
    logger: { debug: vi.fn() },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset all mocks
    vi.mocked(checkUserRoles).mockReset()
    vi.mocked(checkOrganisationRoles).mockReset()
    vi.mocked(getIdFromRelation).mockReset()
    mockPayload.findByID.mockReset()
  })

  test('should grant access when user is a system super admin', async () => {
    // Setup mocks
    vi.mocked(getIdFromRelation).mockReturnValue(mockOrgId)
    vi.mocked(checkUserRoles).mockReturnValue(true)
    vi.mocked(checkOrganisationRoles).mockReturnValue(false)
    mockPayload.findByID.mockResolvedValue(mockOrganisations.org1)

    // Call function with test data
    const result = await currentOrganisationCollectionWriteAccess({
      req: {
        payload: mockPayload,
        user: mockUsers.admin,
      },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(mockUsers.admin.selectedOrganisation)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUsers.admin)
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'organisations',
      id: mockOrgId,
    })
    expect(result).toEqual({
      organisation: {
        equals: mockOrgId,
      },
    })
  })

  test('should return false when user has no selected organization', async () => {
    // Setup mocks
    vi.mocked(getIdFromRelation).mockReturnValue(null)

    // Call function with test data
    const result = await currentOrganisationCollectionWriteAccess({
      req: {
        payload: mockPayload,
        user: mockUsers.regularUser,
      },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(mockUsers.regularUser.selectedOrganisation)
    expect(result).toBe(false)
    // Should not query for organization since userLastLoggedInOrgId is null
    expect(mockPayload.findByID).not.toHaveBeenCalled()
  })

  test('should return false when selected organization does not exist', async () => {
    // Setup mocks
    vi.mocked(getIdFromRelation).mockReturnValue(mockOrgId)
    vi.mocked(checkUserRoles).mockReturnValue(false)
    vi.mocked(checkOrganisationRoles).mockReturnValue(false)
    mockPayload.findByID.mockResolvedValue(null) // Org not found

    // Call function with test data
    const result = await currentOrganisationCollectionWriteAccess({
      req: {
        payload: mockPayload,
        user: mockUsers.userWithOrg1,
      },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(mockUsers.userWithOrg1.selectedOrganisation)
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'organisations',
      id: mockOrgId,
    })
    expect(result).toBe(false)
  })

  test('should grant access when user is organization super admin', async () => {
    // Setup mocks
    vi.mocked(getIdFromRelation).mockReturnValue(mockOrgId)
    vi.mocked(checkUserRoles).mockReturnValue(false) // Not a system super admin
    vi.mocked(checkOrganisationRoles).mockReturnValue(true) // User has super admin role in org
    mockPayload.findByID.mockResolvedValue(mockOrganisations.org1)

    // Call function with test data
    const result = await currentOrganisationCollectionWriteAccess({
      req: {
        payload: mockPayload,
        user: mockUsers.userWithOrg1,
      },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(mockUsers.userWithOrg1.selectedOrganisation)
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'organisations',
      id: mockOrgId,
    })
    expect(checkOrganisationRoles).toHaveBeenCalledWith(
      [ROLE_SUPER_ADMIN],
      mockUsers.userWithOrg1,
      mockOrgId,
    )
    expect(result).toEqual({
      organisation: {
        equals: mockOrgId,
      },
    })
  })

  test('should return false when user is not an admin in the organization', async () => {
    // Setup mocks
    vi.mocked(getIdFromRelation).mockReturnValue(mockOrgId)
    vi.mocked(checkUserRoles).mockReturnValue(false) // Not a system super admin
    vi.mocked(checkOrganisationRoles).mockReturnValue(false) // User does NOT have admin role in org
    mockPayload.findByID.mockResolvedValue(mockOrganisations.org1)

    // Call function with test data
    const result = await currentOrganisationCollectionWriteAccess({
      req: {
        payload: mockPayload,
        user: mockUsers.userWithOrg1,
      },
    } as any)

    // Assertions
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUsers.userWithOrg1)
    expect(checkOrganisationRoles).toHaveBeenCalledWith(
      [ROLE_SUPER_ADMIN],
      mockUsers.userWithOrg1,
      mockOrgId,
    )
    expect(result).toBe(false)
  })
})
