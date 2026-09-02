import type { Field } from 'payload'

import { I18nCollection } from '@/lib/i18n-collection'
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
  label: I18nCollection.fieldLabel.createdBy,
  name: 'createdBy',
  relationTo: 'users',
  type: 'relationship',
}
