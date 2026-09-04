import { beforeEach, describe, expect, test, vi } from 'vitest'

import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { createMockRequest, mockUsers } from '@/tests/mocks/test-utils'

import { adminAndSelfCollectionAccess } from './admin-and-self-collection-access'

vi.mock('@/payload/utilities/get-id-from-relation', () => ({
  getIdFromRelation: vi.fn(),
}))

vi.mock('@/payload/utilities/check-user-roles', () => ({
  checkUserRoles: vi.fn(),
}))

describe('collectionAccessAdminAndSelf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should deny access when no user is provided', async () => {
    const result = await adminAndSelfCollectionAccess({ req: { user: null } } as any)

    expect(result).toBe(false)
  })

  test('should grant full access to super admins', async () => {
    const mockUser = mockUsers.admin
    const mockReq = createMockRequest(mockUser)

    vi.mocked(checkUserRoles).mockReturnValue(true)

    const result = await adminAndSelfCollectionAccess({ req: mockReq } as any)

    expect(result).toBe(true)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })

  test('should restrict regular users to only access their own data', async () => {
    const mockUser = mockUsers.regularUser
    mockUser.id = 123
    const mockReq = createMockRequest(mockUser)

    vi.mocked(checkUserRoles).mockReturnValue(false)

    const result = await adminAndSelfCollectionAccess({ req: mockReq } as any)

    expect(result).toEqual({
      id: {
        equals: 123,
      },
    })
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUser)
  })
})
