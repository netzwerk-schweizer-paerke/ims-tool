import type { Access, FieldAccess } from 'payload'

import { checkUserRoles } from '@/payload/utilities/checkUserRoles'
import { User } from '@/payload-types'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { logger } from '@/lib/logger'

export const superAdmins: Access = ({ req: { user } }) => checkUserRoles([ROLE_SUPER_ADMIN], user)

export const superAdminFieldAccess: FieldAccess<User> = ({ req: { user, payload } }) => {
  const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)
  logger.debug(`🔒superAdminFieldAccess: ${isSuperAdmin}`, { user })
  // payload.logger.info({ msg: `User is super admin: ${isSuperAdmin}` });
  return isSuperAdmin
}
