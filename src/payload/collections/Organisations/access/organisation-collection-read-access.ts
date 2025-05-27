import type { Access } from 'payload'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'

/**
 * Access control for organization collections
 *
 * This function grants access in the following scenarios:
 * 1) If the user is a super admin
 * 2) If the user is an admin or user of an accessible organization
 *
 * @returns {boolean|object} - Returns true if access is granted, or a query filter to restrict access
 */
export const organisationCollectionReadAccess: Access = ({ req: { payload, user } }) => {
  // Super admins always get full access
  if (checkUserRoles([ROLE_SUPER_ADMIN], user)) {
    payload.logger.debug({ msg: 'Super admin has full access to all organisations' })
    return true
  }

  // For regular users, determine which organizations they can access
  const accessibleOrganizationIds =
    user?.organisations?.reduce(
      (result, userOrg) => {
        // Only include organizations where the user has super admin role
        if (
          userOrg &&
          checkOrganisationRoles(
            [ROLE_SUPER_ADMIN, ROLE_USER],
            user,
            getIdFromRelation(userOrg.organisation),
          )
        ) {
          const orgId = getIdFromRelation(userOrg.organisation)
          if (orgId) {
            result.push(orgId)
          }
        }
        return result
      },
      [] as (string | number)[],
    ) || []

  if (accessibleOrganizationIds.length === 0) {
    payload.logger.debug({ msg: 'User has no accessible organizations' })
    return false
  }

  // Return access filter to limit to only those organizations
  return {
    id: {
      in: accessibleOrganizationIds,
    },
  }
}
