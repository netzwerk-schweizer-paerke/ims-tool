import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { FieldHook } from 'payload'

export const beforeChangeHook: FieldHook = async ({ req, req: { user }, siblingData }) => {
  if (!user || !req.user) return undefined

  if (siblingData.createdBy) {
    return getIdFromRelation(siblingData.createdBy)
  }

  return user.id
}
