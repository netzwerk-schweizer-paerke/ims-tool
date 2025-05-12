import { checkUserRoles } from '../check-user-roles'
import { ROLE_SUPER_ADMIN } from '../constants'
import { mockUsers } from '@/tests/mocks/test-utils'

describe('checkUserRoles with ROLE_SUPER_ADMIN', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return true when user has super admin role', () => {
    const result = checkUserRoles([ROLE_SUPER_ADMIN], mockUsers.admin)

    expect(result).toBe(true)
  })

  test('should return false when user has regular user role', () => {
    const result = checkUserRoles([ROLE_SUPER_ADMIN], mockUsers.regularUser)

    expect(result).toBe(false)
  })

  test('should return false when user has no roles', () => {
    const result = checkUserRoles([ROLE_SUPER_ADMIN], mockUsers.noRolesUser)

    expect(result).toBe(false)
  })

  test('should return false when user is null', () => {
    const result = checkUserRoles([ROLE_SUPER_ADMIN], null)

    expect(result).toBe(false)
  })
})
