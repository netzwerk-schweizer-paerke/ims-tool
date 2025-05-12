import { currentOrganisationCollectionAccess } from '@/payload/collections/access/current-organisation-collection-access'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import {
  createMockData,
  createMockRequest,
  mockOrganisations,
  mockUsers,
} from '@/tests/mocks/test-utils'

jest.mock('@/payload/utilities/get-id-from-relation', () => ({
  getIdFromRelation: jest.fn(),
}))

jest.mock('@/payload/utilities/check-user-roles', () => ({
  checkUserRoles: jest.fn((roles, user) => {
    if (!user || !user.roles) return false
    return user.roles.includes(ROLE_SUPER_ADMIN)
  }),
}))

describe('currentOrganisationCollectionAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should grant access when user is viewing content from their selected organization', () => {
    const mockUser = mockUsers.userWithOrg1
    const mockData = createMockData(mockOrganisations.org1.id)
    const mockReq = createMockRequest(mockUser)

    ;(getIdFromRelation as jest.Mock).mockImplementation((relation) => {
      if (relation === mockUser.selectedOrganisation) return mockOrganisations.org1.id
      if (relation === mockData.organisation) return mockOrganisations.org1.id
      return null
    })

    const result = currentOrganisationCollectionAccess({ req: mockReq, data: mockData } as any)

    expect(result).toBe(true)
    expect(getIdFromRelation).toHaveBeenCalledTimes(2)
    expect(getIdFromRelation).toHaveBeenCalledWith(mockUser.selectedOrganisation)
    expect(getIdFromRelation).toHaveBeenCalledWith(mockData.organisation)
  })

  test('should grant access when user is an admin without a selected organization', () => {
    const mockUser = mockUsers.admin
    const mockData = createMockData(mockOrganisations.org2.id)
    const mockReq = createMockRequest(mockUser)

    ;(getIdFromRelation as jest.Mock).mockReturnValue(null)

    const result = currentOrganisationCollectionAccess({ req: mockReq, data: mockData } as any)

    expect(getIdFromRelation).toHaveBeenCalledWith(mockUser.selectedOrganisation)
    expect(result).toBe(true)
  })

  test('should return organization filter when user has a selected organization but data is from a different organization', () => {
    const mockUser = mockUsers.userWithOrg1
    const mockData = createMockData(mockOrganisations.org2.id)
    const mockReq = createMockRequest(mockUser)

    ;(getIdFromRelation as jest.Mock).mockImplementation((relation) => {
      if (relation === mockUser.selectedOrganisation) return mockOrganisations.org1.id
      if (relation === mockData.organisation) return mockOrganisations.org2.id
      return null
    })

    const result = currentOrganisationCollectionAccess({ req: mockReq, data: mockData } as any)

    expect(result).toEqual({
      organisation: {
        equals: mockOrganisations.org1.id,
      },
    })
    expect(getIdFromRelation).toHaveBeenCalledWith(mockUser.selectedOrganisation)
    expect(getIdFromRelation).toHaveBeenCalledWith(mockData.organisation)
  })

  test('should return organization filter when no specific document is being viewed', () => {
    const mockUser = mockUsers.userWithOrg1
    const mockReq = createMockRequest(mockUser)

    ;(getIdFromRelation as jest.Mock).mockReturnValue(mockOrganisations.org1.id)

    const result = currentOrganisationCollectionAccess({ req: mockReq } as any)

    expect(result).toEqual({
      organisation: {
        equals: mockOrganisations.org1.id,
      },
    })
    expect(getIdFromRelation).toHaveBeenCalledWith(mockUser.selectedOrganisation)
  })
})
