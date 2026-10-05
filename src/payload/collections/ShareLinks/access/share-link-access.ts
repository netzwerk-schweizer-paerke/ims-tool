import type { Access } from 'payload'

import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { administeredOrganisationId, isParkAdmin } from '@/payload/utilities/is-park-admin'

/** Create. A reader may open a link, but only an administrator may make one (PIMS-92). */
export const shareLinkCreateAccess: Access = ({ req: { user } }) => isParkAdmin(user)

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
