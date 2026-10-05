import type { ClientUser } from 'payload'

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
 * True for a super admin, and for an admin of the selected park. A reader is neither.
 *
 * `admin.hidden` and `useAuth` pass a `ClientUser`, which carries an index signature instead of
 * the generated fields. The one cast lives here, so no call site repeats it.
 */
export const isParkAdmin = (user: ClientUser | null | undefined | User): boolean => {
  const typed = (user ?? null) as null | User

  return checkUserRoles([ROLE_SUPER_ADMIN], typed) || administeredOrganisationId(typed) !== null
}
