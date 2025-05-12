import { authenticatedCollectionAccess } from '@/payload/collections/access/authenticated-collection-access'
import { createMockRequest, mockUsers } from '@/tests/mocks/test-utils'

describe('authenticatedCollectionAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should grant access when a user is authenticated', () => {
    const mockUser = mockUsers.regularUser
    const mockReq = createMockRequest(mockUser)

    const result = authenticatedCollectionAccess({ req: mockReq } as any)

    expect(result).toBe(true)
  })

  test('should deny access when no user is provided', () => {
    const mockReq = { user: null }

    const result = authenticatedCollectionAccess({ req: mockReq } as any)

    expect(result).toBe(false)
  })

  test('should deny access when user is undefined', () => {
    const mockReq = { user: undefined }

    const result = authenticatedCollectionAccess({ req: mockReq } as any)

    expect(result).toBe(false)
  })
})
