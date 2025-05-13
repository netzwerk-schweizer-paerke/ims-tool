import { currentOrganisationCollectionWriteAccess } from '../current-organisation-collection-write-access'
import { checkUserRoles } from '../../../utilities/check-user-roles'
import { checkOrganisationRoles } from '../../../utilities/check-organisation-roles'
import { getIdFromRelation } from '../../../utilities/get-id-from-relation'
import { ROLE_SUPER_ADMIN } from '../../../utilities/constants'
import { mockOrganisations, mockUsers } from '@/tests/mocks/test-utils'

// Mock dependencies
jest.mock('../../../utilities/check-user-roles')
jest.mock('../../../utilities/check-organisation-roles')
jest.mock('../../../utilities/get-id-from-relation')

describe('currentOrganisationCollectionWriteAccess', () => {
  // Test data
  const mockOrgId = mockOrganisations.org1.id
  const mockPayload = {
    find: jest.fn(),
    logger: { debug: jest.fn() },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset all mocks
    jest.mocked(checkUserRoles).mockReset()
    jest.mocked(checkOrganisationRoles).mockReset()
    jest.mocked(getIdFromRelation).mockReset()
    mockPayload.find.mockReset()
  })

  test('should grant access when user is a super admin', async () => {
    // Setup mocks
    jest.mocked(checkUserRoles).mockReturnValue(true)

    // Call function with test data
    const result = await currentOrganisationCollectionWriteAccess({
      req: {
        user: mockUsers.admin,
        payload: mockPayload,
      },
    } as any)

    // Assertions
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUsers.admin)
    expect(result).toBe(true)
    // Should not query for organization since user is super admin
    expect(mockPayload.find).not.toHaveBeenCalled()
  })

  test('should return false when user has no selected organization', async () => {
    // Setup mocks
    jest.mocked(checkUserRoles).mockReturnValue(false)
    jest.mocked(getIdFromRelation).mockReturnValue(null)

    // Call function with test data
    const result = await currentOrganisationCollectionWriteAccess({
      req: {
        user: mockUsers.regularUser,
        payload: mockPayload,
      },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(null) // regularUser has no selectedOrganisation in this context
    expect(result).toBe(false)
    // Should not query for organization since userLastLoggedInOrgId is null
    expect(mockPayload.find).not.toHaveBeenCalled()
  })

  test('should return false when selected organization does not exist', async () => {
    // Setup mocks
    jest.mocked(checkUserRoles).mockReturnValue(false)
    jest.mocked(getIdFromRelation).mockReturnValue(mockOrgId)
    mockPayload.find.mockResolvedValue({ docs: [] }) // Empty result = org not found

    // Call function with test data
    const result = await currentOrganisationCollectionWriteAccess({
      req: {
        user: mockUsers.userWithOrg1,
        payload: mockPayload,
      },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(mockUsers.userWithOrg1.selectedOrganisation)
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'organisations',
      where: {
        id: {
          equals: mockOrgId,
        },
      },
    })
    expect(result).toBe(false)
  })

  test('should check organization roles when organization exists', async () => {
    // Setup mocks
    jest.mocked(checkUserRoles).mockReturnValue(false)
    jest.mocked(getIdFromRelation).mockReturnValue(mockOrgId)
    jest.mocked(checkOrganisationRoles).mockReturnValue(true) // User has admin role in org
    mockPayload.find.mockResolvedValue({
      docs: [mockOrganisations.org1],
    })

    // Call function with test data
    const result = await currentOrganisationCollectionWriteAccess({
      req: {
        user: mockUsers.userWithOrg1,
        payload: mockPayload,
      },
    } as any)

    // Assertions
    expect(getIdFromRelation).toHaveBeenCalledWith(mockUsers.userWithOrg1.selectedOrganisation)
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'organisations',
      where: {
        id: {
          equals: mockOrgId,
        },
      },
    })
    expect(checkOrganisationRoles).toHaveBeenCalledWith(
      [ROLE_SUPER_ADMIN],
      mockUsers.userWithOrg1,
      mockOrgId,
    )
    expect(result).toBe(true)
  })

  test('should return false when user is not an admin in the organization', async () => {
    // Setup mocks
    jest.mocked(checkUserRoles).mockReturnValue(false)
    jest.mocked(getIdFromRelation).mockReturnValue(mockOrgId)
    jest.mocked(checkOrganisationRoles).mockReturnValue(false) // User does NOT have admin role in org
    mockPayload.find.mockResolvedValue({
      docs: [mockOrganisations.org1],
    })

    // Call function with test data
    const result = await currentOrganisationCollectionWriteAccess({
      req: {
        user: mockUsers.userWithOrg1,
        payload: mockPayload,
      },
    } as any)

    // Assertions
    expect(checkOrganisationRoles).toHaveBeenCalledWith(
      [ROLE_SUPER_ADMIN],
      mockUsers.userWithOrg1,
      mockOrgId,
    )
    expect(result).toBe(false)
  })
})
