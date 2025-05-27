import type { Access, FieldAccess } from 'payload'

import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { User } from '@/payload-types'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'

export const superAdminsCollectionAccess: Access = ({ req: { user } }) =>
  checkUserRoles([ROLE_SUPER_ADMIN], user)

export const superAdminFieldAccess: FieldAccess<User> = ({ req: { user, payload } }) => {
  return checkUserRoles([ROLE_SUPER_ADMIN], user)
}
