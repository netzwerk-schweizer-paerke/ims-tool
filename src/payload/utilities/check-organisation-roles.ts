import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { User, UserOrganisations } from '@/payload-types'
import { logger } from '@/lib/logger'

type NonEmptyArray<T> = T extends (infer U)[] ? (U[] extends [] ? never : T) : never

type NonEmptyUserOrganisations = NonEmptyArray<UserOrganisations>

type Roles = NonEmptyUserOrganisations[0]['roles']

/**
 * Check if a user has specific roles within a given organization.
 *
 * This utility function examines a user's organization-specific roles to determine if they
 * have any of the specified roles within the target organization. The function is designed to:
 *
 * 1. Handle null/undefined user inputs safely
 * 2. Check all user organizations against the specified organization ID
 * 3. Verify if the user has any of the specified roles in that organization
 * 4. Provide detailed logging for troubleshooting
 *
 * This is particularly useful for organization-scoped access control, where permissions
 * are restricted to specific organizations rather than being global.
 *
 * @param requiredRoles - Array of role identifiers to check for
 * @param user - The user object to check permissions for
 * @param organisationId - The specific organization ID to verify roles against
 * @returns boolean - True if the user has any of the specified roles in the organization, false otherwise
 */
export const checkOrganisationRoles = (
  requiredRoles: Roles = [],
  user: User | null,
  organisationId: number,
): boolean => {
  // Safety check: If no user or no required roles, return false immediately
  if (!user) {
    logger.debug('checkOrganisationRoles: No user provided', {
      requiredRoles,
      organisationId,
    })
    return false
  }

  if (!requiredRoles.length) {
    logger.debug('checkOrganisationRoles: No roles specified to check', {
      userId: user.id,
      organisationId,
    })
    return false
  }

  // Safety check: If user has no organizations array, return false
  if (!user.organisations || !Array.isArray(user.organisations)) {
    logger.debug('checkOrganisationRoles: User has no organisations', {
      userId: user.id,
      organisationId,
      requiredRoles,
    })
    return false
  }

  // Find the user's organization that matches the target organization ID
  const matchingOrganisation = user.organisations.find((org) => {
    // For safety, check if the organisation property exists
    if (!org || typeof org !== 'object' || !('organisation' in org)) {
      return false
    }

    // Get the organization ID using the utility function
    const orgId = getIdFromRelation(org.organisation)

    return orgId === organisationId
  })

  // If no matching organization is found, return false
  if (!matchingOrganisation) {
    logger.debug('checkOrganisationRoles: User does not belong to the specified organisation', {
      userId: user.id,
      organisationId,
      userOrganisations: user.organisations.map((org) => getIdFromRelation(org.organisation)),
    })
    return false
  }

  // Check if the user has any of the required roles in this specific organization
  const hasRequiredRole = requiredRoles.some((requiredRole) => {
    return matchingOrganisation.roles?.includes(requiredRole) || false
  })

  logger.debug(
    `checkOrganisationRoles: User ${hasRequiredRole ? 'has' : 'does not have'} required role in organization`,
    {
      userId: user.id,
      organisationId,
      requiredRoles,
      userRolesInOrg: matchingOrganisation.roles || [],
      hasRequiredRole,
    },
  )

  return hasRequiredRole
}
