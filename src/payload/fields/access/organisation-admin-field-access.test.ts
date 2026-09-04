import { beforeEach, describe, expect, test, vi } from 'vitest'

import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { createMockRequest, mockOrganisations, mockUsers } from '@/tests/mocks/test-utils'

import { organisationAdminFieldAccess } from './organisation-admin-field-access'

vi.mock('@/payload/utilities/get-id-from-relation', () => ({
  getIdFromRelation: vi.fn(),
}))

vi.mock('@/payload/utilities/check-user-roles', () => ({
  checkUserRoles: vi.fn(),
}))

describe('organisationAdminFieldAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should grant access when user is a super admin', () => {
    const mockUser = mockUsers.admin
    const mockReq = createMockRequest(mockUser)
    const mockDoc = { organisation: mockOrganisations.org1 }

    vi.mocked(checkUserRoles).mockReturnValue(true)

    const result = organisationAdminFieldAccess({ doc: mockDoc, req: mockReq } as any)

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

    vi.mocked(checkUserRoles).mockReturnValue(false)
    vi.mocked(getIdFromRelation).mockImplementation((relation) => {
      if (relation === mockOrganisations.org1) return mockOrganisations.org1.id
      return null
    })

    const result = organisationAdminFieldAccess({ doc: mockDoc, req: mockReq } as any)

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

    vi.mocked(checkUserRoles).mockReturnValue(false)

    const result = organisationAdminFieldAccess({ doc: mockDoc, req: mockReq } as any)

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

    vi.mocked(checkUserRoles).mockReturnValue(false)
    vi.mocked(getIdFromRelation).mockImplementation((relation) => {
      if (relation === mockOrganisations.org1) return mockOrganisations.org1.id
      return null
    })

    const result = organisationAdminFieldAccess({ doc: mockDoc, req: mockReq } as any)

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

    vi.mocked(checkUserRoles).mockReturnValue(false)
    vi.mocked(getIdFromRelation).mockImplementation((relation) => {
      if (relation === mockOrganisations.org1) return mockOrganisations.org1.id
      if (relation === mockOrganisations.org2) return mockOrganisations.org2.id
      return null
    })

    const result = organisationAdminFieldAccess({ doc: mockDoc, req: mockReq } as any)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })

  test('should deny access when user has no organisations', () => {
    const mockUser = mockUsers.regularUser

    mockUser.organisations = null

    const mockReq = createMockRequest(mockUser)
    const mockDoc = { organisation: mockOrganisations.org1 }

    vi.mocked(checkUserRoles).mockReturnValue(false)
    vi.mocked(getIdFromRelation).mockReturnValue(null)

    const result = organisationAdminFieldAccess({ doc: mockDoc, req: mockReq } as any)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })
})
