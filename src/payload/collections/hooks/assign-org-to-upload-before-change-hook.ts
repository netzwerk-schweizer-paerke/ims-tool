import { CollectionBeforeChangeHook } from 'payload'

import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

export const assignOrgToUploadBeforeChangeHook: CollectionBeforeChangeHook = async ({
  context,
  data,
  req,
  req: { user },
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
