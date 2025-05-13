import type { Access } from 'payload'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

/**
 * Access control function that determines if a user can access content from a specific organization. The content item needs to have an organization field.
 *
 * This function grants access in the following scenarios:
 * 1. If the user's currently selected organization matches the organization of the content being accessed
 *
 * @param {object} params - The access control parameters
 * @returns {boolean|object} - Returns true if access is granted, or a query filter to restrict access
 */
export const currentOrganisationCollectionReadAccess: Access = ({ req: { user } }) => {
  const userLastLoggedInOrgId = getIdFromRelation(user?.selectedOrganisation)

  return {
    organisation: {
      equals: userLastLoggedInOrgId,
    },
  }
}
