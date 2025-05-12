import { CollectionConfig } from 'payload'
import { I18nCollection } from '@/lib/i18nCollection'
import { currentOrganisationCollectionAccess } from '@/payload/collections/access/current-organisation-collection-access'
import { authenticatedCollectionAccess } from '@/payload/collections/access/authenticated-collection-access'
import { organisationAdminsCollectionAccess } from '@/payload/collections/access/organisation-admin-collection-access'
import { adminSettingsField } from '@/payload/fields/admin-settings'
import { assignOrgToUploadBeforeChangeHook } from '@/payload/collections/hooks/assign-org-to-upload-before-change-hook'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    hideAPIURL: true,
    group: I18nCollection.collectionGroup.files,
    hidden: true,
  },
  access: {
    read: currentOrganisationCollectionAccess,
    create: authenticatedCollectionAccess,
    update: organisationAdminsCollectionAccess,
    delete: organisationAdminsCollectionAccess,
  },
  hooks: {
    beforeChange: [assignOrgToUploadBeforeChangeHook],
  },
  upload: {
    imageSizes: [
      {
        name: 'thumbnail',
        width: 200,
        height: 200,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        position: 'centre',
      },
    ],
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'name',
      label: I18nCollection.fieldLabel.name,
      localized: true,
      type: 'text',
    },
    {
      name: 'description',
      label: I18nCollection.fieldLabel.description,
      localized: true,
      type: 'textarea',
    },
    adminSettingsField({ sidebar: true }),
  ],
}
