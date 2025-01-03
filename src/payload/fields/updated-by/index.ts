import type { Field } from 'payload'

import { superAdminFieldAccess } from '../../access/superAdmins'
import { organisationFieldAdminAccess } from './access/admin'
import { beforeChangeHook } from './hooks/beforeChangeHook'

export const updatedByField: Field = {
  name: 'updatedBy',
  type: 'relationship',
  relationTo: 'users',
  index: true,
  access: {
    create: superAdminFieldAccess,
    read: organisationFieldAdminAccess,
    update: superAdminFieldAccess,
  },
  hooks: {
    beforeChange: [beforeChangeHook],
  },
}
