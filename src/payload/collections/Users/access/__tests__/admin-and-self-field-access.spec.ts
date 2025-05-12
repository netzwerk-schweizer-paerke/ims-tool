import { adminAndSelfFieldAccess } from '@/payload/collections/Users/access/admin-and-self-field-access'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { createMockRequest, mockUsers } from '@/tests/mocks/test-utils'

jest.mock('@/payload/utilities/check-user-roles', () => ({
  checkUserRoles: jest.fn(),
}))

describe('adminAndSelfFieldAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should deny access when no user is provided', async () => {
    const result = await adminAndSelfFieldAccess({
      req: { user: null },
      doc: {},
      data: {},
    } as any)

    expect(result).toBe(false)
  })

  test('should grant access to admin users', async () => {
    const mockUser = mockUsers.admin
    const mockReq = createMockRequest(mockUser)

    ;(checkUserRoles as jest.Mock).mockReturnValue(true)

    const result = await adminAndSelfFieldAccess({
      req: mockReq,
      doc: { id: 456 },
      data: {},
    } as any)

    expect(result).toBe(true)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })

  test('should grant access to users accessing their own data', async () => {
    const mockUser = mockUsers.regularUser
    mockUser.id = 123
    const mockReq = createMockRequest(mockUser)
    
    ;(checkUserRoles as jest.Mock).mockReturnValue(false)

    const result = await adminAndSelfFieldAccess({
      req: mockReq,
      doc: { id: 123 },
      data: { name: 'Updated Name' }
    } as any)

    expect(result).toBe(true)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })

  test('should deny access to users accessing others data', async () => {
    const mockUser = mockUsers.regularUser
    mockUser.id = 123
    const mockReq = createMockRequest(mockUser)
    
    ;(checkUserRoles as jest.Mock).mockReturnValue(false)

    const result = await adminAndSelfFieldAccess({
      req: mockReq,
      doc: { id: 456 },
      data: { name: 'Another User' }
    } as any)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })

  test('should deny access when doc or data is missing', async () => {
    const mockUser = mockUsers.regularUser
    mockUser.id = 123
    const mockReq = createMockRequest(mockUser)
    
    ;(checkUserRoles as jest.Mock).mockReturnValue(false)

    const result = await adminAndSelfFieldAccess({
      req: mockReq,
      doc: null,
      data: { name: 'Test' }
    } as any)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })
})
