import type { Field } from 'payload'

import { organisationAdminFieldAccess } from '@/payload/fields/access/organisation-admin-field-access'

import { superAdminFieldAccess } from '../../access/super-admins-collection-access'
import { beforeChangeHook } from './hooks/before-change-hook'

export const createdByField: Field = {
  access: {
    create: superAdminFieldAccess,
    read: organisationAdminFieldAccess,
    update: superAdminFieldAccess,
  },
  hooks: {
    beforeChange: [beforeChangeHook],
  },
  index: true,
  name: 'createdBy',
  relationTo: 'users',
  type: 'relationship',
}
