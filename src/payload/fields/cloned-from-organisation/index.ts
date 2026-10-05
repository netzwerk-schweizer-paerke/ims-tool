import type { Field } from 'payload'

import { I18nCollection } from '@/lib/i18n-collection'
import { organisationAdminFieldAccess } from '@/payload/fields/access/organisation-admin-field-access'

/**
 * The park a clone came from. `createCloneEndpoint` sets it on the record the user picked, and
 * the statistics aggregate it per source and target park (PIMS-93).
 *
 * A duplicate is not a clone, so the duplicate starts empty.
 */
export const clonedFromOrganisationField: Field = {
  access: {
    create: () => false,
    read: organisationAdminFieldAccess,
    update: () => false,
  },
  admin: {
    position: 'sidebar',
    readOnly: true,
  },
  hooks: {
    beforeDuplicate: [() => null],
  },
  index: true,
  label: I18nCollection.fieldLabel.clonedFromOrganisation,
  name: 'clonedFromOrganisation',
  relationTo: 'organisations',
  type: 'relationship',
}
