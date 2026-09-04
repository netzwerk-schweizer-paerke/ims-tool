import type { Access, ClientUser } from 'payload'

import { User } from '@/payload-types'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

/**
 * The organisation this user administers, or null. Membership alone is not enough here, because
 * `selectedOrganisation` is writable by its own owner. See the decision page
 * `selected-organisation-needs-a-membership-check`.
 */
export const administeredOrganisationId = (user: null | User): null | number => {
  const organisationId = getIdFromRelation(user?.selectedOrganisation)

  if (organisationId === null) {
    return null
  }

  return checkOrganisationRoles([ROLE_SUPER_ADMIN], user, organisationId) ? organisationId : null
}

/**
 * True when the user may see the share-link collection in the admin navigation.
 *
 * `admin.hidden` passes a `ClientUser`, which carries an index signature instead of the generated
 * fields. The one cast lives here, so no call site repeats it.
 */
export const isShareLinkAdmin = (user: ClientUser | null | undefined | User): boolean => {
  const typed = (user ?? null) as null | User

  return checkUserRoles([ROLE_SUPER_ADMIN], typed) || administeredOrganisationId(typed) !== null
}

/**
 * Read and delete. A super admin sees every link, a park admin sees the links of their park, and
 * every other user sees the links they created themselves.
 */
export const shareLinkOwnerOrAdminAccess: Access = ({ req: { user } }) => {
  if (!user) {
    return false
  }

  if (checkUserRoles([ROLE_SUPER_ADMIN], user)) {
    return true
  }

  const own = { createdBy: { equals: user.id } }
  const organisationId = administeredOrganisationId(user)

  return organisationId === null ? own : { or: [own, { organisation: { equals: organisationId } }] }
}

/** Update. The creator has no reason to edit a link, so only an administrator may. */
export const shareLinkAdminAccess: Access = ({ req: { user } }) => {
  if (!user) {
    return false
  }

  if (checkUserRoles([ROLE_SUPER_ADMIN], user)) {
    return true
  }

  const organisationId = administeredOrganisationId(user)

  return organisationId === null ? false : { organisation: { equals: organisationId } }
}
