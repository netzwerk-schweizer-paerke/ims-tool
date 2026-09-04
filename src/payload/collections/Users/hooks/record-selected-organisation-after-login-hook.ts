import { CollectionAfterLoginHook } from 'payload'

import { User } from '@/payload-types'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

export const recordSelectedOrganisationAfterLoginHook: CollectionAfterLoginHook<User> = async ({
  req,
  user,
}) => {
  req.payload.logger.info({ userId: user.id }, 'Setting selected organisation for user')
  try {
    let selectedOrgId = user.selectedOrganisation

    // A revoked membership can leave a stored organisation the user no longer belongs
    // to. Read access denies that value, so reset it instead of showing an empty list.
    const storedOrgId = getIdFromRelation(selectedOrgId)
    const belongsToStoredOrg = (user.organisations ?? []).some(
      (membership) => getIdFromRelation(membership.organisation) === storedOrgId,
    )

    if (storedOrgId !== null && !belongsToStoredOrg && !checkUserRoles([ROLE_SUPER_ADMIN], user)) {
      req.payload.logger.warn(
        { selectedOrganisation: storedOrgId, userId: user.id },
        'Stored organisation is not assigned to the user, resetting it',
      )
      selectedOrgId = null
    }

    if (!selectedOrgId) {
      req.payload.logger.info(
        { userId: user.id },
        'No selected organisation found for the user, setting a default',
      )
      selectedOrgId = user.organisations?.[0]?.organisation
    }

    if (!selectedOrgId) {
      // Never log the user record here. An afterLogin hook runs before the field-level afterRead,
      // so the record still carries `hash`, `salt` and `resetPasswordToken`.
      req.payload.logger.warn({ userId: user.id }, 'No organisations found for the user')
      return user
    }

    await req.payload.update({
      collection: 'users',
      data: {
        selectedOrganisation: selectedOrgId || null,
      },
      id: user.id,
      req,
    })
  } catch (error: unknown) {
    req.payload.logger.error({ err: error, userId: user.id }, 'Error recording selected organisation for user')
  }

  return user
}
