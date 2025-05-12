import type { Access } from 'payload'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'

// the user must be an admin of the organisation being accessed
export const organisationAdmins: Access = ({ req: { user } }) => {
  const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)

  if (isSuperAdmin) {
    return true
  }

  return {
    id: {
      in:
        user?.organisations
          ?.map(({ organisation, roles }) =>
            roles.includes(ROLE_SUPER_ADMIN) ? getIdFromRelation(organisation) : null,
          ) // eslint-disable-line function-paren-newline
          .filter(Boolean) || [],
    },
  }
}
