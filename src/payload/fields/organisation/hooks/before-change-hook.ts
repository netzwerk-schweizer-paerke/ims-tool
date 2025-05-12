import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { FieldHook } from 'payload'

export const beforeChangeHook: FieldHook = async ({ req, req: { user }, data }) => {
  if (!user || !req.user) return undefined

  if (checkUserRoles([ROLE_SUPER_ADMIN], req.user) && data?.organisation) {
    return data.organisation
  }

  const selectedOrganisation = getIdFromRelation(user.selectedOrganisation)

  if (selectedOrganisation) {
    return selectedOrganisation
  }

  return undefined
}
