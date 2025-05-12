import type { Field } from 'payload'

import { superAdminFieldAccess } from '../../access/superAdmins'
import { organisationAdminFieldAccess } from '@/payload/fields/access/organisation-admin-field-access'
import { beforeChangeHook } from './hooks/before-change-hook'

export const createdByField: Field = {
  name: 'createdBy',
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
