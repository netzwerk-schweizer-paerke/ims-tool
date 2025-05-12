import { isAdmin } from '../is-admin'
import { ROLE_SUPER_ADMIN } from '../constants'
import type { User } from '@/payload-types'
import { mockUsers } from '@/tests/mocks/test-utils'
import { checkUserRoles } from '../check-user-roles'

jest.mock('../check-user-roles', () => ({
  checkUserRoles: jest.fn(([role], user) => {
    if (!user || !user.roles) return false
    return user.roles.includes(role)
  }),
}))

describe('isAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return true when user has super admin role', () => {
    const result = isAdmin(mockUsers.admin as User)

    expect(result).toBe(true)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUsers.admin)
  })

  test('should return false when user has regular user role', () => {
    const result = isAdmin(mockUsers.regularUser as User)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUsers.regularUser)
  })

  test('should return false when user has no roles', () => {
    const result = isAdmin(mockUsers.noRolesUser as User)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], mockUsers.noRolesUser)
  })

  test('should return false when user is null', () => {
    const result = isAdmin(null)

    expect(result).toBe(false)
    expect(checkUserRoles).toHaveBeenCalledWith([ROLE_SUPER_ADMIN], null)
  })
})
