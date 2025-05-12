import type { FieldAccess } from 'payload'

import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

/**
 * Field access control that grants access based on organisation admin role.
 *
 * This function implements field-level access control by checking:
 * 1. If the user is a super admin (always granted access)
 * 2. If the user is an admin of the organisation that the document belongs to
 *
 * Access is denied in the following cases:
 * - The document has no organisation field
 * - The user is not an admin of the document's organisation
 * - The user has no organisations
 *
 * This access control is useful for fields that should only be visible or editable
 * by users who manage the same organisation as the document.
 *
 * @param {object} params - The access control parameters
 * @returns {boolean} - True if access is granted, false otherwise
 */
export const organisationAdminFieldAccess: FieldAccess = ({ req: { user }, doc }) => {
  if (checkUserRoles([ROLE_SUPER_ADMIN], user)) {
    return true
  }

  if (!doc?.organisation) {
    return false
  }

  for (const userOrg of user?.organisations || []) {
    const userOrgId = getIdFromRelation(userOrg.organisation)
    const docOrgId = getIdFromRelation(doc?.organisation)

    if (userOrgId === docOrgId && userOrg.roles?.includes(ROLE_SUPER_ADMIN)) {
      return true
    }
  }

  return false
}
