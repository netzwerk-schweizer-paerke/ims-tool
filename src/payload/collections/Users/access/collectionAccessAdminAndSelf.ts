import type { Access, AccessResult } from 'payload'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'

export const collectionAccessAdminAndSelf: Access = async ({
  req: { user, payload },
}): Promise<AccessResult> => {
  if (!user) return false
  const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)
  if (isSuperAdmin) {
    return true
  }

  if (!isSuperAdmin) {
    return {
      id: {
        equals: user.id,
      },
    }
  }

  // allow users to read themselves and any users within the isCurrentlySelectedOrganisationAccess they are admins of
  return {
    or: [
      {
        id: {
          equals: user.id,
        },
      },
      {
        'organisations.organisation': {
          in: [getIdFromRelation(user.selectedOrganisation)].filter(
            (id): id is string | number => id !== null,
          ),
        },
      },
    ],
  }
}
