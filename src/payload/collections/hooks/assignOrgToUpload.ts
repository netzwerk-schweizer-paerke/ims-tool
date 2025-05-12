import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { CollectionBeforeChangeHook } from 'payload'

export const assignOrgToUpload: CollectionBeforeChangeHook = async ({ req: { user }, data }) => {
  data.prefix = `${data.prefix}/${getIdFromRelation(user?.selectedOrganisation)}`
  return data
}
