import type { FieldAccess } from 'payload'

import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { checkOrganisationRoles } from '../../../utilities/check-organisation-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { User } from '@/payload-types'
import { isNumber } from 'lodash-es'

/**
 * Field access control that grants access to organization administrators.
 *
 * This function implements field-level access control for organization-specific fields by:
 * 1. Granting access to users with a global super admin role
 * 2. Granting access to users who are defined as admins within specific organizations
 *
 * This access control ensures that organization-specific fields can only be modified by
 * users with appropriate administrative permissions for that organization.
 *
 * @param {Object} args - Payload field access control function parameters
 * @returns {boolean} True if access is granted, false otherwise
 */
export const organisationAdminFieldAccess: FieldAccess<User> = (args) => {
  const {
    req: { user },
    doc,
  } = args

  // Always grant access to super admins
  if (checkUserRoles([ROLE_SUPER_ADMIN], user)) {
    return true
  }

  // No document or no organizations means no access
  if (!doc?.organisations) {
    return false
  }

  // Check if user is an admin for any of the organizations in the document
  return doc.organisations.some(({ organisation }) => {
    // Validate organization ID format
    if (!isNumber(organisation)) {
      throw new Error('organisationAdmins: The organisation ID must be a number')
    }

    // Check if user has admin role in this organization
    return checkOrganisationRoles([ROLE_SUPER_ADMIN], user, organisation)
  })
}
