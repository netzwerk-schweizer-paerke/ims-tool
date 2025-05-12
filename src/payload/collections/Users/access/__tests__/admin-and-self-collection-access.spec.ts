import { adminAndSelfCollectionAccess } from '@/payload/collections/Users/access/admin-and-self-collection-access'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { createMockRequest, mockUsers } from '@/tests/mocks/test-utils'

jest.mock('@/payload/utilities/get-id-from-relation', () => ({
  getIdFromRelation: jest.fn(),
}))

jest.mock('@/payload/utilities/check-user-roles', () => ({
  checkUserRoles: jest.fn(),
}))

describe('collectionAccessAdminAndSelf', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should deny access when no user is provided', async () => {
    const result = await adminAndSelfCollectionAccess({ req: { user: null } } as any)

    expect(result).toBe(false)
  })

  test('should grant full access to super admins', async () => {
    const mockUser = mockUsers.admin
    const mockReq = createMockRequest(mockUser)

    ;(checkUserRoles as jest.Mock).mockReturnValue(true)

    const result = await adminAndSelfCollectionAccess({ req: mockReq } as any)

    expect(result).toBe(true)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })

  test('should restrict regular users to only access their own data', async () => {
    const mockUser = mockUsers.regularUser
    mockUser.id = 123
    const mockReq = createMockRequest(mockUser)

    ;(checkUserRoles as jest.Mock).mockReturnValue(false)

    const result = await adminAndSelfCollectionAccess({ req: mockReq } as any)

    expect(result).toEqual({
      id: {
        equals: 123,
      },
    })
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })
})
