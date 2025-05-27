import type { Access } from 'payload'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'

/**
 * Access control function that determines if a user can access content from a specific organization. The content item needs to have an organization field.
 *
 * This function grants access in the following scenarios:
 * 1. If the user is a super admin and has no selected organization, they get full access
 * 2. If the user has a selected organization, they can only access content from that organization
 * 3. If the user has no selected organization and is not a super admin, they only see content with no organization
 *
 * @param {object} params - The access control parameters
 * @returns {boolean|object} - Returns true if access is granted, or a query filter to restrict access
 */
export const currentOrganisationCollectionReadAccess: Access = ({ req: { user } }) => {
  const userLastLoggedInOrgId = getIdFromRelation(user?.selectedOrganisation)

  // If user has no selected organization
  if (userLastLoggedInOrgId === null) {
    // Super admins with no selected org get full access
    if (checkUserRoles([ROLE_SUPER_ADMIN], user)) {
      return true
    }
    
    // Regular users with no selected org only see content with no organization
    return {
      organisation: {
        equals: null,
      },
    }
  }

  // Users with selected organization can only see content from that organization
  return {
    organisation: {
      equals: userLastLoggedInOrgId,
    },
  }
}
