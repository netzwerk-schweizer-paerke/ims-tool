import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { Access } from 'payload'
import { User } from '@/payload-types'

/**
 * Access control function for collections that only organisation administrators should be able to manage
 *
 * This function implements Payload CMS's Access control pattern to determine if a user has access to
 * organisation-specific resources. It grants access to:
 * 1. Super administrators (users with the 'admin' role)
 * 2. Users who are administrators of their currently selected organisation
 *
 * @param {Object} params - Payload access control function parameters
 * @returns {boolean} True if the user has access, false otherwise
 */
export const organisationAdminsCollectionAccess: Access<User> = ({ req: { user } }) => {
  // Users with admin role always have superuser access
  if (checkUserRoles([ROLE_SUPER_ADMIN], user)) {
    return true
  }

  // Regular users need to be associated with the currently selected organisation and be defined as an admin
  const userOrgsAndRoles = user?.organisations?.map(({ organisation, roles }) => {
    return {
      id: getIdFromRelation(organisation),
      roles: roles || [],
    }
  })

  const selectedOrgId = getIdFromRelation(user?.selectedOrganisation)

  return !!userOrgsAndRoles?.some(
    ({ id, roles }) => id === selectedOrgId && roles.includes(ROLE_SUPER_ADMIN),
  )
}
