import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { CollectionBeforeChangeHook } from 'payload'

export const assignOrgToUploadBeforeChangeHook: CollectionBeforeChangeHook = async ({
  req,
  req: { user },
  data,
  context,
}) => {
  // Debug logging
  req.payload.logger.info('[Upload Hook] Context:', context?.targetOrganisationId)
  req.payload.logger.info('[Upload Hook] req.context:', req.context?.targetOrganisationId)

  // Allow override for cloning operations - check both context and req.context
  const targetOrgId =
    context?.targetOrganisationId ||
    req.context?.targetOrganisationId ||
    getIdFromRelation(user?.selectedOrganisation)

  // Log for debugging during testing
  if (context?.targetOrganisationId || req.context?.targetOrganisationId) {
    req.payload.logger.info(`[Upload Hook] Using context override for org: ${targetOrgId}`)
  }

  data.prefix = `${data.prefix}/${targetOrgId}`
  return data
}
