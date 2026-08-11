import { CollectionConfig } from 'payload'

import { isProduction } from '@/lib/environment'
import { I18nCollection } from '@/lib/i18n-collection'
import { superAdminsCollectionAccess } from '@/payload/access/super-admins-collection-access'
import { organisationCollectionReadAccess } from '@/payload/collections/Organisations/access/organisation-collection-read-access'
import { createdByField } from '@/payload/fields/created-by'
import { updatedByField } from '@/payload/fields/updated-by'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'

export const Organisations: CollectionConfig = {
  access: {
    create: superAdminsCollectionAccess,
    delete: superAdminsCollectionAccess,
    read: organisationCollectionReadAccess,
    update: organisationCollectionReadAccess,
  },
  admin: {
    group: I18nCollection.collectionGroup.settings,
    hidden: (user) => {
      return !user?.user?.roles?.includes(ROLE_SUPER_ADMIN)
    },
    hideAPIURL: isProduction,
    useAsTitle: 'name',
  },
  fields: [
    {
      label: I18nCollection.fieldLabel.name,
      name: 'name',
      required: true,
      type: 'text',
    },
    {
      label: I18nCollection.fieldLabel.description,
      name: 'description',
      type: 'textarea',
    },
    {
      defaultValue: 'de',
      label: I18nCollection.fieldLabel.organisationLanguage,
      name: 'organisationLanguage',
      options: [
        {
          label: I18nCollection.fieldLabel.english,
          value: 'en',
        },
        {
          label: I18nCollection.fieldLabel.french,
          value: 'fr',
        },
        {
          label: I18nCollection.fieldLabel.german,
          value: 'de',
        },
        {
          label: I18nCollection.fieldLabel.italian,
          value: 'it',
        },
      ],
      type: 'select',
    },
    createdByField,
    updatedByField,
  ],
  labels: {
    plural: I18nCollection.fieldLabel.organisations,
    singular: I18nCollection.fieldLabel.organisation,
  },
  slug: 'organisations',
}
