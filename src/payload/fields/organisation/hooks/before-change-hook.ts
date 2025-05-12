import { isAdmin } from '@/payload/utilities/is-admin'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { FieldHook } from 'payload'

export const beforeChangeHook: FieldHook = async ({ req, req: { user }, data }) => {
  if (!user || !req.user) return undefined

  if (isAdmin(req.user) && data?.organisation) {
    return data.organisation
  }

  const selectedOrganisation = getIdFromRelation(user.selectedOrganisation)

  if (selectedOrganisation) {
    return selectedOrganisation
  }

  return undefined
}
