import { beforeEach, describe, expect, test, vi } from 'vitest'

import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { createMockRequest, mockUsers } from '@/tests/mocks/test-utils'

import { adminAndSelfFieldAccess } from './admin-and-self-field-access'

vi.mock('@/payload/utilities/check-user-roles', () => ({
  checkUserRoles: vi.fn(),
}))

describe('adminAndSelfFieldAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should deny access when no user is provided', async () => {
    const result = await adminAndSelfFieldAccess({
      data: {},
      doc: {},
      req: { user: null },
    } as any)

    expect(result).toBe(false)
  })

  test('should grant access to admin users', async () => {
    const mockUser = mockUsers.admin
    const mockReq = createMockRequest(mockUser)

    vi.mocked(checkUserRoles).mockReturnValue(true)

    const result = await adminAndSelfFieldAccess({
      data: {},
      doc: { id: 456 },
      req: mockReq,
    } as any)

    expect(result).toBe(true)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })

  test('should grant access to users accessing their own data', async () => {
    const mockUser = mockUsers.regularUser
    mockUser.id = 123
    const mockReq = createMockRequest(mockUser)

    vi.mocked(checkUserRoles).mockReturnValue(false)

    const result = await adminAndSelfFieldAccess({
      data: { name: 'Updated Name' },
      doc: { id: 123 },
      req: mockReq,
    } as any)

    expect(result).toBe(true)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })

  test('should deny access to users accessing others data', async () => {
    const mockUser = mockUsers.regularUser
    mockUser.id = 123
    const mockReq = createMockRequest(mockUser)

    vi.mocked(checkUserRoles).mockReturnValue(false)

    const result = await adminAndSelfFieldAccess({
      data: { name: 'Another User' },
      doc: { id: 456 },
      req: mockReq,
    } as any)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })

  test('should deny access when doc or data is missing', async () => {
    const mockUser = mockUsers.regularUser
    mockUser.id = 123
    const mockReq = createMockRequest(mockUser)

    vi.mocked(checkUserRoles).mockReturnValue(false)

    const result = await adminAndSelfFieldAccess({
      data: { name: 'Test' },
      doc: null,
      req: mockReq,
    } as any)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })
})
