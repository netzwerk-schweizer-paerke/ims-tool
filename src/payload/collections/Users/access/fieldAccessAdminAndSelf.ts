import type { FieldAccess } from 'payload'

import { isAdmin } from '@/payload/utilities/is-admin'

export const fieldAccessAdminAndSelf: FieldAccess = async ({
  req: { user, payload },
  doc,
  data,
}) => {
  if (!user) return false
  const isSuperAdmin = isAdmin(user)
  if (isSuperAdmin) {
    return true
  }

  if (doc && data) {
    if (doc.id === user.id) {
      return true
    }
  }

  return false
}
