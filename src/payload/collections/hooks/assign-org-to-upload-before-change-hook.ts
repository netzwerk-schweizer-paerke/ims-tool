import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { CollectionBeforeChangeHook } from 'payload'

export const assignOrgToUploadBeforeChangeHook: CollectionBeforeChangeHook = async ({
  req,
  req: { user },
  data,
  context,
}) => {
  // Debug logging
  req.payload.logger.info({ targetOrganisationId: context?.targetOrganisationId }, '[Upload Hook] Context')
  req.payload.logger.info({ targetOrganisationId: req.context?.targetOrganisationId }, '[Upload Hook] req.context')

  // Allow override for cloning operations - check both context and req.context
  const targetOrgId =
    context?.targetOrganisationId ||
    req.context?.targetOrganisationId ||
    getIdFromRelation(user?.selectedOrganisation)

  // Log for debugging during testing
  if (context?.targetOrganisationId || req.context?.targetOrganisationId) {
    req.payload.logger.info({ targetOrgId }, '[Upload Hook] Using context override for org')
  }

  data.prefix = `${data.prefix}/${targetOrgId}`
  return data
}
