import { CollectionConfig } from 'payload'
import { I18nCollection } from '@/lib/i18n-collection'
import { superAdminsCollectionAccess } from '@/payload/access/super-admins-collection-access'
import { organisationCollectionReadAccess } from '@/payload/collections/Organisations/access/organisation-collection-read-access'
import { createdByField } from '@/payload/fields/created-by'
import { updatedByField } from '@/payload/fields/updated-by'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'

export const Organisations: CollectionConfig = {
  slug: 'organisations',
  labels: {
    plural: I18nCollection.fieldLabel.organisations,
    singular: I18nCollection.fieldLabel.organisation,
  },
  admin: {
    hideAPIURL: true,
    group: I18nCollection.collectionGroup.settings,
    useAsTitle: 'name',
    hidden: (user) => {
      return !user?.user?.roles?.includes(ROLE_SUPER_ADMIN)
    },
  },
  access: {
    create: superAdminsCollectionAccess,
    read: organisationCollectionReadAccess,
    update: organisationCollectionReadAccess,
    delete: superAdminsCollectionAccess,
  },
  fields: [
    {
      name: 'name',
      label: I18nCollection.fieldLabel.name,
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: I18nCollection.fieldLabel.description,
      type: 'textarea',
    },
    {
      name: 'organisationLanguage',
      label: I18nCollection.fieldLabel.organisationLanguage,
      type: 'select',
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
      defaultValue: 'de',
    },
    createdByField,
    updatedByField,
  ],
}
