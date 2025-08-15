import { organisationAdminFieldAccess } from '@/payload/collections/Users/access/organisation-admin-field-access'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { createMockRequest, mockOrganisations, mockUsers } from '@/tests/mocks/test-utils'

// Mock the necessary dependencies
jest.mock('@/payload/utilities/check-user-roles', () => ({
  checkUserRoles: jest.fn(),
}))

jest.mock('@/payload/utilities/check-organisation-roles', () => ({
  checkOrganisationRoles: jest.fn(),
}))

// Mock the es-toolkit module
jest.mock('es-toolkit/predicate', () => ({
  isNumber: jest.fn((val) => typeof val === 'number'),
}))

describe('organisationAdmins', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should grant access to super admins', () => {
    const mockUser = mockUsers.admin
    const mockReq = createMockRequest(mockUser)
    const mockDoc = {}

    // Set up the mock to return true for super admin check
    ;(checkUserRoles as jest.Mock).mockReturnValue(true)

    const result = organisationAdminFieldAccess({
      req: mockReq,
      doc: mockDoc,
    } as any)

    expect(result).toBe(true)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
    expect(checkOrganisationRoles).not.toHaveBeenCalled()
  })

  test('should grant access to organization admins', () => {
    const mockUser = mockUsers.regularUser
    const mockReq = createMockRequest(mockUser)
    const mockDoc = {
      organisations: [{ organisation: mockOrganisations.org1.id }],
    }

    // Set up the mocks to return appropriate values
    ;(checkUserRoles as jest.Mock).mockReturnValue(false)
    ;(checkOrganisationRoles as jest.Mock).mockReturnValue(true)

    const result = organisationAdminFieldAccess({
      req: mockReq,
      doc: mockDoc,
    } as any)

    expect(result).toBe(true)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
    expect(checkOrganisationRoles).toHaveBeenCalledWith(
      [ROLE_SUPER_ADMIN],
      mockUser,
      mockOrganisations.org1.id,
    )
  })

  test('should deny access to non-admin users', () => {
    const mockUser = mockUsers.regularUser
    const mockReq = createMockRequest(mockUser)
    const mockDoc = {
      organisations: [{ organisation: mockOrganisations.org1.id }],
    }

    // Set up the mocks to return appropriate values
    ;(checkUserRoles as jest.Mock).mockReturnValue(false)
    ;(checkOrganisationRoles as jest.Mock).mockReturnValue(false)

    const result = organisationAdminFieldAccess({
      req: mockReq,
      doc: mockDoc,
    } as any)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
    expect(checkOrganisationRoles).toHaveBeenCalledWith(
      [ROLE_SUPER_ADMIN],
      mockUser,
      mockOrganisations.org1.id,
    )
  })

  test('should handle documents without organisations field', () => {
    const mockUser = mockUsers.regularUser
    const mockReq = createMockRequest(mockUser)
    const mockDoc = {}

    // Set up the mocks to return appropriate values
    ;(checkUserRoles as jest.Mock).mockReturnValue(false)

    const result = organisationAdminFieldAccess({
      req: mockReq,
      doc: mockDoc,
    } as any)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
    expect(checkOrganisationRoles).not.toHaveBeenCalled()
  })

  test('should throw error if organisation is not a number', () => {
    const mockUser = mockUsers.regularUser
    const mockReq = createMockRequest(mockUser)
    const mockDoc = {
      organisations: [{ organisation: 'not-a-number' }],
    }

    // Set up the mocks to return appropriate values
    ;(checkUserRoles as jest.Mock).mockReturnValue(false)

    // Mock isNumber to return false for this test
    const { isNumber } = require('es-toolkit/predicate')
    ;(isNumber as jest.Mock).mockReturnValue(false)

    expect(() =>
      organisationAdminFieldAccess({
        req: mockReq,
        doc: mockDoc,
      } as any),
    ).toThrow('organisationAdmins: The organisation ID must be a number')

    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
    expect(checkOrganisationRoles).not.toHaveBeenCalled()
  })
})
