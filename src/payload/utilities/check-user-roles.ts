import { User } from '@/payload-types'
import { logger } from '@/lib/logger'
import { Roles } from '@/payload/utilities/constants'

/**
 * Check if a user has any of the specified roles.
 *
 * This utility function verifies if a user has at least one of the roles specified
 * in the roles array. It's designed to be used for access control decisions across
 * the application, particularly for determining if a user has permission to perform
 * certain actions.
 *
 * Key features:
 * 1. Handles null/undefined users and roles safely
 * 2. Provides detailed debug logging for troubleshooting
 * 3. Can check against multiple required roles (matches if ANY role matches)
 *
 * @param requiredRoles - Array of roles to check against the user's roles
 * @param user - The user object to evaluate
 * @returns boolean - True if the user has at least one of the required roles, false otherwise
 */
export const checkUserRoles = (requiredRoles: Roles = [], user: User | null): boolean => {
  // Early exit if user is null/undefined
  if (!user) {
    logger.debug('checkUserRoles: No user provided, denying access', { requiredRoles })
    return false
  }

  // Early exit if no roles to check or user has no roles
  if (!requiredRoles.length) {
    logger.debug('checkUserRoles: No roles specified to check, denying access', {
      userId: user.id,
    })
    return false
  }

  if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
    logger.debug('checkUserRoles: User has no roles, denying access', {
      userId: user.id,
      requiredRoles,
    })
    return false
  }

  // Check if any of the required roles match any of the user's roles
  const hasRequiredRole = requiredRoles.some((requiredRole) => user.roles.includes(requiredRole))

  logger.debug(`checkUserRoles: User ${hasRequiredRole ? 'has' : 'does not have'} required role`, {
    userId: user.id,
    requiredRoles,
    userRoles: user.roles,
    hasRequiredRole,
  })

  return hasRequiredRole
}
