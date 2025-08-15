import type { Access, AccessResult } from 'payload'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'

/**
 * Collection access control that grants access to administrators and users viewing their own data.
 *
 * This function implements Payload CMS's Access control pattern for user collections by:
 * 1. Granting full access to super admins
 * 2. Allowing users to access only their own data (by ID)
 * 3. Creating a query filter that restricts access based on the above rules
 *
 * This follows the principle of least privilege, ensuring users can only see and modify
 * their own data unless they have administrative privileges.
 *
 * @param {Object} params - Payload access control function parameters
 * @returns {AccessResult} Either a boolean or a query filter restricting access
 */
export const adminAndSelfCollectionAccess: Access = async ({
  req: { user },
}): Promise<AccessResult> => {
  if (!user) return false
  const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)
  if (isSuperAdmin) {
    return true
  }

  if (!isSuperAdmin) {
    return {
      id: {
        equals: user.id,
      },
    }
  }

  // allow users to read themselves and any users within the isCurrentlySelectedOrganisationAccess they are admins of
  return {
    or: [
      {
        id: {
          equals: user.id,
        },
      },
      {
        'organisations.organisation': {
          in: [getIdFromRelation(user.selectedOrganisation)].filter(
            (id): id is number => id !== null,
          ),
        },
      },
    ],
  }
}
