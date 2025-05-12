import { organisationAdminFieldAccess } from '@/payload/fields/access/organisation-admin-field-access'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { createMockRequest, mockOrganisations, mockUsers } from '@/tests/mocks/test-utils'

jest.mock('@/payload/utilities/get-id-from-relation', () => ({
  getIdFromRelation: jest.fn(),
}))

jest.mock('@/payload/utilities/check-user-roles', () => ({
  checkUserRoles: jest.fn(),
}))

describe('organisationAdminFieldAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should grant access when user is a super admin', () => {
    const mockUser = mockUsers.admin
    const mockReq = createMockRequest(mockUser)
    const mockDoc = { organisation: mockOrganisations.org1 }

    ;(checkUserRoles as jest.Mock).mockReturnValue(true)

    const result = organisationAdminFieldAccess({ req: mockReq, doc: mockDoc } as any)

    expect(result).toBe(true)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
    expect(getIdFromRelation).not.toHaveBeenCalled()
  })

  test('should grant access when user is an admin for the document organisation', () => {
    const mockUser = mockUsers.adminWithOrg1

    mockUser.organisations = [
      {
        organisation: mockOrganisations.org1,
        roles: [ROLE_SUPER_ADMIN],
      },
    ]

    const mockReq = createMockRequest(mockUser)
    const mockDoc = { organisation: mockOrganisations.org1 }

    ;(checkUserRoles as jest.Mock).mockReturnValue(false)
    ;(getIdFromRelation as jest.Mock).mockImplementation((relation) => {
      if (relation === mockOrganisations.org1) return mockOrganisations.org1.id
      return null
    })

    const result = organisationAdminFieldAccess({ req: mockReq, doc: mockDoc } as any)

    expect(result).toBe(true)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
    expect(getIdFromRelation).toHaveBeenCalledTimes(2)
  })

  test('should deny access when document has no organisation', () => {
    const mockUser = mockUsers.adminWithOrg1

    mockUser.organisations = [
      {
        organisation: mockOrganisations.org1,
        roles: [ROLE_SUPER_ADMIN],
      },
    ]

    const mockReq = createMockRequest(mockUser)
    const mockDoc = {}

    ;(checkUserRoles as jest.Mock).mockReturnValue(false)

    const result = organisationAdminFieldAccess({ req: mockReq, doc: mockDoc } as any)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
    expect(getIdFromRelation).not.toHaveBeenCalled()
  })

  test('should deny access when user is not an admin for the document organisation', () => {
    const mockUser = mockUsers.userWithOrg1

    mockUser.organisations = [
      {
        organisation: mockOrganisations.org1,
        roles: ['user'],
      },
    ]

    const mockReq = createMockRequest(mockUser)
    const mockDoc = { organisation: mockOrganisations.org1 }

    ;(checkUserRoles as jest.Mock).mockReturnValue(false)
    ;(getIdFromRelation as jest.Mock).mockImplementation((relation) => {
      if (relation === mockOrganisations.org1) return mockOrganisations.org1.id
      return null
    })

    const result = organisationAdminFieldAccess({ req: mockReq, doc: mockDoc } as any)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })

  test('should deny access when user is an admin for a different organisation than the document', () => {
    const mockUser = mockUsers.adminWithOrg1

    mockUser.organisations = [
      {
        organisation: mockOrganisations.org1,
        roles: [ROLE_SUPER_ADMIN],
      },
    ]

    const mockReq = createMockRequest(mockUser)
    const mockDoc = { organisation: mockOrganisations.org2 }

    ;(checkUserRoles as jest.Mock).mockReturnValue(false)
    ;(getIdFromRelation as jest.Mock).mockImplementation((relation) => {
      if (relation === mockOrganisations.org1) return mockOrganisations.org1.id
      if (relation === mockOrganisations.org2) return mockOrganisations.org2.id
      return null
    })

    const result = organisationAdminFieldAccess({ req: mockReq, doc: mockDoc } as any)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })

  test('should deny access when user has no organisations', () => {
    const mockUser = mockUsers.regularUser

    mockUser.organisations = null

    const mockReq = createMockRequest(mockUser)
    const mockDoc = { organisation: mockOrganisations.org1 }

    ;(checkUserRoles as jest.Mock).mockReturnValue(false)
    ;(getIdFromRelation as jest.Mock).mockReturnValue(null)

    const result = organisationAdminFieldAccess({ req: mockReq, doc: mockDoc } as any)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })
})
