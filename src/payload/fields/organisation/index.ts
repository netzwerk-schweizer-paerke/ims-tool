import type { Field } from 'payload'

import { organisationAdminFieldAccess } from '@/payload/fields/access/organisation-admin-field-access'
import { beforeChangeHook } from '@/payload/fields/organisation/hooks/before-change-hook'

import { superAdminFieldAccess } from '../../access/super-admins-collection-access'

export const organisationField: Field = {
  access: {
    create: superAdminFieldAccess,
    read: organisationAdminFieldAccess,
    update: superAdminFieldAccess,
  },
  admin: {
    description:
      "The organisation this record belongs to. It is set automatically based on the user's role and his or her selected organisation while creating a new record.",
  },
  hooks: {
    // automatically set the organisation to the last logged in organisation
    // for super admins, allow them to set the organisation
    beforeChange: [beforeChangeHook],
  },
  // don't require this field because we need to autopopulate it, see below
  // required: true,
  // we also don't want to hide this field because super-admins may need to manage it
  // to achieve this, create a custom component that conditionally renders the field based on the user's role
  // hidden: true,
  index: true,
  name: 'organisation',
  relationTo: 'organisations',
  type: 'relationship',
}
