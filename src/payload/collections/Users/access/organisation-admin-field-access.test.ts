import { isNumber } from 'es-toolkit/predicate'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { createMockRequest, mockOrganisations, mockUsers } from '@/tests/mocks/test-utils'

import { organisationAdminFieldAccess } from './organisation-admin-field-access'

// Mock the necessary dependencies
vi.mock('@/payload/utilities/check-user-roles', () => ({
  checkUserRoles: vi.fn(),
}))

vi.mock('@/payload/utilities/check-organisation-roles', () => ({
  checkOrganisationRoles: vi.fn(),
}))

// Mock the es-toolkit module
vi.mock('es-toolkit/predicate', () => ({
  isNumber: vi.fn((val: unknown) => typeof val === 'number'),
}))

describe('organisationAdmins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should grant access to super admins', () => {
    const mockUser = mockUsers.admin
    const mockReq = createMockRequest(mockUser)
    const mockDoc = {}

    // Set up the mock to return true for super admin check
    vi.mocked(checkUserRoles).mockReturnValue(true)

    const result = organisationAdminFieldAccess({
      doc: mockDoc,
      req: mockReq,
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
    vi.mocked(checkUserRoles).mockReturnValue(false)
    vi.mocked(checkOrganisationRoles).mockReturnValue(true)

    const result = organisationAdminFieldAccess({
      doc: mockDoc,
      req: mockReq,
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
    vi.mocked(checkUserRoles).mockReturnValue(false)
    vi.mocked(checkOrganisationRoles).mockReturnValue(false)

    const result = organisationAdminFieldAccess({
      doc: mockDoc,
      req: mockReq,
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
    vi.mocked(checkUserRoles).mockReturnValue(false)

    const result = organisationAdminFieldAccess({
      doc: mockDoc,
      req: mockReq,
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
    vi.mocked(checkUserRoles).mockReturnValue(false)

    // Mock isNumber to return false for this test
    vi.mocked(isNumber).mockReturnValue(false)

    expect(() =>
      organisationAdminFieldAccess({
        doc: mockDoc,
        req: mockReq,
      } as any),
    ).toThrow('organisationAdmins: The organisation ID must be a number')

    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
    expect(checkOrganisationRoles).not.toHaveBeenCalled()
  })
})
