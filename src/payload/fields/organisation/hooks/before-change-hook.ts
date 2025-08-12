import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { FieldHook } from 'payload'

export const beforeChangeHook: FieldHook = async ({ req, req: { user }, data, context }) => {
  if (!user || !req.user) return undefined

  // Debug logging
  console.log('[Organisation Hook] Context:', context)
  console.log('[Organisation Hook] req.context:', req.context)

  // Check for context override (used in cloning operations)
  // Try both context and req.context
  const targetOrgId = context?.targetOrganisationId || req.context?.targetOrganisationId
  if (targetOrgId) {
    console.log(`[Organisation Hook] Using context override: ${targetOrgId}`)
    return targetOrgId
  }

  if (checkUserRoles([ROLE_SUPER_ADMIN], req.user) && data?.organisation) {
    return data.organisation
  }

  const selectedOrganisation = getIdFromRelation(user.selectedOrganisation)

  if (selectedOrganisation) {
    return selectedOrganisation
  }

  return undefined
}
