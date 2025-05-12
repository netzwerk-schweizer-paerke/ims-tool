import type { Field } from 'payload'

import { superAdminFieldAccess } from '../../access/superAdmins'
import { beforeChangeHook } from './hooks/before-change-hook'
import { organisationAdminFieldAccess } from '@/payload/fields/access/organisation-admin-field-access'

export const updatedByField: Field = {
  name: 'updatedBy',
  type: 'relationship',
  relationTo: 'users',
  index: true,
  access: {
    create: superAdminFieldAccess,
    read: organisationAdminFieldAccess,
    update: superAdminFieldAccess,
  },
  hooks: {
    beforeChange: [beforeChangeHook],
  },
}
