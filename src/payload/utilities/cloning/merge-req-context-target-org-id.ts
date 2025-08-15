import { PayloadRequest } from 'payload'

export function mergeReqContextTargetOrgId(req: PayloadRequest, targetOrgId: number) {
  if (!targetOrgId) {
    throw new Error('A target organisation id needs to be set to context')
  }
  return {
    ...req,
    context: {
      ...req.context,
      targetOrganisationId: targetOrgId,
    },
  }
}
