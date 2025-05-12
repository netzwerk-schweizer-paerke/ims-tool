import type { Access } from 'payload'

import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

/**
 * Access control function that determines if a user can access content from a specific organization.
 *
 * This function grants access in the following scenarios:
 * 1. If the user's currently selected organization matches the organization of the content being accessed
 * 2. If the user has no selected organization but has admin privileges
 * 3. Otherwise, it returns a query filter to restrict access to content from the user's selected organization
 *
 * This implements the organization-specific access control as defined in the access management assumptions,
 * ensuring users can only access content from their associated organizations.
 *
 * @param {object} params - The access control parameters
 * @returns {boolean|object} - Returns true if access is granted, or a query filter to restrict access
 */
export const currentOrganisationCollectionAccess: Access = ({ req: { user }, data }) => {
  const userLastLoggedInOrgId = getIdFromRelation(user?.selectedOrganisation)

  // Case 1: User is viewing content from their selected organization
  if (data && 'organisation' in data) {
    const dataOrgId = getIdFromRelation(data?.organisation)
    if (userLastLoggedInOrgId === dataOrgId) {
      return true
    }
  }

  // Case 2: User is an admin without a selected organization
  if (!userLastLoggedInOrgId && checkUserRoles([ROLE_SUPER_ADMIN], user)) {
    return true
  }

  // Case 3: Return a filter to only show content from the user's selected organization
  return {
    organisation: {
      equals: userLastLoggedInOrgId,
    },
  }
}
