import type { Access } from 'payload'

import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'

/**
 * Access control function that determines if a user can modify content from a specific organization. The content item needs to have an organization field.
 *
 * This function grants access in the following scenarios:
 * 1. If the user's currently selected organization matches the organization of the content being modified and the user has super admin role in the organization
 * 2. If the user has global super admin role
 *
 * @param {object} params - The access control parameters
 * @returns {boolean|object} - Returns true if access is granted, or a query filter to restrict access
 */
export const currentOrganisationCollectionWriteAccess: Access = async ({
  req: { user, payload },
}) => {
  const userLastLoggedInOrgId = getIdFromRelation(user?.selectedOrganisation)

  if (!userLastLoggedInOrgId || !user || typeof userLastLoggedInOrgId !== 'number') {
    return false
  }

  const selectedOrganisation = await payload.findByID({
    collection: 'organisations',
    id: userLastLoggedInOrgId,
  })

  const hasSelectedOrganisation = !!selectedOrganisation
  const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)
  const isOrgSuperAdmin = checkOrganisationRoles([ROLE_SUPER_ADMIN], user, userLastLoggedInOrgId)

  if (hasSelectedOrganisation && (isSuperAdmin || isOrgSuperAdmin)) {
    return {
      organisation: {
        equals: userLastLoggedInOrgId,
      },
    }
  }

  return false
}
