import { checkUserRoles } from '../check-user-roles'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '../constants'
import type { User } from '@/payload-types'
import { mockUsers } from '@/tests/mocks/test-utils'
import { logger } from '@/lib/logger'

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
  },
}))

describe('checkUserRoles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return true when user has at least one of the required roles', () => {
    const result = checkUserRoles([ROLE_SUPER_ADMIN], mockUsers.admin as User)

    expect(result).toBe(true)
    expect(logger.debug).toHaveBeenCalled()
  })

  test('should return true when user has any of multiple required roles', () => {
    const result = checkUserRoles([ROLE_SUPER_ADMIN, ROLE_USER], mockUsers.regularUser as User)

    expect(result).toBe(true)
    expect(logger.debug).toHaveBeenCalled()
  })

  test('should return false when user has none of the required roles', () => {
    const result = checkUserRoles([ROLE_SUPER_ADMIN], mockUsers.otherRoleUser as User)

    expect(result).toBe(false)
    expect(logger.debug).toHaveBeenCalled()
  })

  test('should return false when user is null', () => {
    const result = checkUserRoles([ROLE_SUPER_ADMIN], null)

    expect(result).toBe(false)
    expect(logger.debug).toHaveBeenCalled()
  })

  test('should return false when user has no roles', () => {
    const result = checkUserRoles([ROLE_SUPER_ADMIN], mockUsers.noRolesUser as User)

    expect(result).toBe(false)
    expect(logger.debug).toHaveBeenCalled()
  })

  test('should return false when no roles are required but user has roles', () => {
    const result = checkUserRoles([], mockUsers.regularUser as User)

    expect(result).toBe(false)
    expect(logger.debug).toHaveBeenCalled()
  })
})
