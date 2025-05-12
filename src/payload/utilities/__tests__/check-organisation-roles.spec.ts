import { checkOrganisationRoles } from '../check-organisation-roles'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '../constants'
import { getIdFromRelation } from '../get-id-from-relation'
import { logger } from '@/lib/logger'
import { mockOrganisations, mockUsers } from '@/tests/mocks/test-utils'
import { User } from '@/payload-types'

// Mock the dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
  },
}))

jest.mock('../get-id-from-relation', () => ({
  getIdFromRelation: jest.fn(),
}))

describe('checkOrganisationRoles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return true when user has required role in the target organization', () => {
    const user: User = {
      ...mockUsers.admin,
      organisations: [
        {
          organisation: 1,
          roles: [ROLE_SUPER_ADMIN],
        },
      ],
    }

    ;(getIdFromRelation as jest.Mock).mockReturnValue(1)

    const result = checkOrganisationRoles([ROLE_SUPER_ADMIN], user, 1)

    expect(result).toBe(true)
    expect(logger.debug).toHaveBeenCalled()
    expect(getIdFromRelation).toHaveBeenCalledWith(1)
  })

  test('should return false when user does not have required role in the target organization', () => {
    const user: User = {
      ...mockUsers.regularUser,
      organisations: [
        {
          organisation: 1,
          roles: [ROLE_USER],
        },
      ],
    }

    ;(getIdFromRelation as jest.Mock).mockReturnValue(1)

    const result = checkOrganisationRoles([ROLE_SUPER_ADMIN], user, 1)

    expect(result).toBe(false)
    expect(logger.debug).toHaveBeenCalled()
    expect(getIdFromRelation).toHaveBeenCalledWith(1)
  })

  test('should return false when user belongs to the organization but has no roles', () => {
    const user = {
      ...mockUsers.noRolesUser,
      organisations: [
        {
          organisation: 1,
          roles: [],
        },
      ],
    }

    ;(getIdFromRelation as jest.Mock).mockReturnValue(1)

    const result = checkOrganisationRoles([ROLE_SUPER_ADMIN], user, 1)

    expect(result).toBe(false)
    expect(logger.debug).toHaveBeenCalled()
  })

  test('should return false when user does not belong to the target organization', () => {
    const user: User = {
      ...mockUsers.admin,
      organisations: [
        {
          organisation: 1,
          roles: [ROLE_SUPER_ADMIN],
        },
      ],
    }

    ;(getIdFromRelation as jest.Mock).mockReturnValue(1)

    const result = checkOrganisationRoles([ROLE_SUPER_ADMIN], user, 2)

    expect(result).toBe(false)
    expect(logger.debug).toHaveBeenCalled()
  })

  test('should return false when user has no organizations', () => {
    const user = {
      ...mockUsers.admin,
      organisations: [],
    }

    const result = checkOrganisationRoles([ROLE_SUPER_ADMIN], user, 1)

    expect(result).toBe(false)
    expect(logger.debug).toHaveBeenCalled()
  })

  test('should return false when user is null', () => {
    const result = checkOrganisationRoles([ROLE_SUPER_ADMIN], null, 1)

    expect(result).toBe(false)
    expect(logger.debug).toHaveBeenCalled()
  })

  test('should return false when no roles are required', () => {
    const user: User = {
      ...mockUsers.admin,
      organisations: [
        {
          organisation: 1,
          roles: [ROLE_SUPER_ADMIN],
        },
      ],
    }

    ;(getIdFromRelation as jest.Mock).mockReturnValue(1)

    const result = checkOrganisationRoles([], user, 1)

    expect(result).toBe(false)
    expect(logger.debug).toHaveBeenCalled()
  })

  test('should handle complex organization object when using getIdFromRelation', () => {
    const user: User = {
      ...mockUsers.admin,
      organisations: [
        {
          organisation: mockOrganisations.org1,
          roles: [ROLE_SUPER_ADMIN],
        },
      ],
    }

    ;(getIdFromRelation as jest.Mock).mockImplementation((org) => {
      if (typeof org === 'object' && org !== null && 'id' in org) {
        return org.id
      }
      return org
    })

    const result = checkOrganisationRoles([ROLE_SUPER_ADMIN], user, 1)

    expect(result).toBe(true)
    expect(logger.debug).toHaveBeenCalled()
    expect(getIdFromRelation).toHaveBeenCalledWith(mockOrganisations.org1)
  })

  test('should return true when user has any of multiple required roles in the target organization', () => {
    const user: User = {
      ...mockUsers.regularUser,
      organisations: [
        {
          organisation: 1,
          roles: [ROLE_USER],
        },
      ],
    }

    ;(getIdFromRelation as jest.Mock).mockReturnValue(1)

    const result = checkOrganisationRoles([ROLE_SUPER_ADMIN, ROLE_USER], user, 1)

    expect(result).toBe(true)
    expect(logger.debug).toHaveBeenCalled()
  })
})
