import { APIError, CollectionBeforeChangeHook } from 'payload'

import { User } from '@/payload-types'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

/**
 * Keeps `selectedOrganisation` inside the target user's memberships.
 *
 * Read access is scoped by this field, so an unchecked value reaches another
 * organisation's content. A field access rule cannot guard it, because Payload discards
 * a denied value without an error. See decisions/selected-organisation-needs-a-membership-check.
 */
export const enforceSelectedOrganisationMembershipHook: CollectionBeforeChangeHook<User> = ({
  data,
  originalDoc,
  req,
}) => {
  const next = getIdFromRelation(data.selectedOrganisation)
  const previous = getIdFromRelation(originalDoc?.selectedOrganisation)

  // A super admin may select any organisation, so neither half applies to one.
  const targetRoles = data.roles ?? originalDoc?.roles ?? []
  if (targetRoles.includes(ROLE_SUPER_ADMIN)) {
    return data
  }

  // Part 1 — reject a change to an organisation the target user does not belong to.
  // A call with no user comes from server code, such as the repair in OrganisationSelect.
  // The collection's own update rule already rejects an unauthenticated request.
  const callerMayChooseFreely = !req.user || checkUserRoles([ROLE_SUPER_ADMIN], req.user)

  // A write of `null` passes. It selects no park, and the read rule then answers nothing.
  if (next !== null && next !== previous && !callerMayChooseFreely) {
    // Read the memberships from the stored document, never from the request. `data` would
    // let a caller assert their own membership if the field rule that strips it ever changes.
    const storedMemberships = originalDoc?.organisations ?? []
    const isMember = storedMemberships.some(
      (membership) => getIdFromRelation(membership.organisation) === next,
    )

    if (!isMember) {
      req.payload.logger.warn(
        { selectedOrganisation: next, targetUserId: originalDoc?.id, userId: req.user?.id },
        'access_denied: selected organisation is not assigned to the user',
      )
      throw new APIError('The selected organisation is not assigned to this user.', 403)
    }
  }

  // Part 2 — move the selection when this write removes the membership it points at.
  // Without this an admin who revokes a membership strands the user on a 404 list view
  // until the next page load repairs it.
  const finalMemberships = data.organisations ?? originalDoc?.organisations ?? []
  const selected = next ?? previous

  if (selected !== null && finalMemberships.length > 0) {
    const stillAMember = finalMemberships.some(
      (membership) => getIdFromRelation(membership.organisation) === selected,
    )

    if (!stillAMember) {
      data.selectedOrganisation = getIdFromRelation(finalMemberships[0].organisation)
      req.payload.logger.info(
        { from: selected, targetUserId: originalDoc?.id, to: data.selectedOrganisation },
        'Moved the selected organisation, because the write removed its membership',
      )
    }
  }

  return data
}
