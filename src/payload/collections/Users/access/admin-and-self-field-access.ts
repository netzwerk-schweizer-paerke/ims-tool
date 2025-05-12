import type { FieldAccess } from 'payload'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'

/**
 * Field access control that grants access to administrators and users editing their own data.
 *
 * This function implements field-level access control for user-related fields by:
 * 1. Granting full access to admin users (using the isAdmin utility)
 * 2. Allowing users to access their own data fields
 * 3. Denying access in all other scenarios
 *
 * This access control ensures sensitive user fields can only be modified by
 * the user themselves or by system administrators.
 *
 * @param {Object} params - Payload field access control function parameters
 * @returns {boolean} True if access is granted, false otherwise
 */
export const adminAndSelfFieldAccess: FieldAccess = async ({ req: { user }, doc, data }) => {
  if (!user) return false

  const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)

  if (isSuperAdmin) {
    return true
  }

  if (doc && data) {
    if (doc.id === user.id) {
      return true
    }
  }

  return false
}
