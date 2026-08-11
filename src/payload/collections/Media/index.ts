import { CollectionConfig } from 'payload'

import { isProduction } from '@/lib/environment'
import { I18nCollection } from '@/lib/i18n-collection'
import { currentOrganisationCollectionReadAccess } from '@/payload/collections/access/current-organisation-collection-read-access'
import { currentOrganisationCollectionWriteAccess } from '@/payload/collections/access/current-organisation-collection-write-access'
import { assignOrgToUploadBeforeChangeHook } from '@/payload/collections/hooks/assign-org-to-upload-before-change-hook'
import { adminSettingsField } from '@/payload/fields/admin-settings'

export const Media: CollectionConfig = {
  access: {
    create: currentOrganisationCollectionWriteAccess,
    delete: currentOrganisationCollectionWriteAccess,
    read: currentOrganisationCollectionReadAccess,
    update: currentOrganisationCollectionWriteAccess,
  },
  admin: {
    group: I18nCollection.collectionGroup.files,
    hidden: true,
    hideAPIURL: isProduction,
  },
  fields: [
    {
      label: I18nCollection.fieldLabel.name,
      localized: true,
      name: 'name',
      type: 'text',
    },
    {
      label: I18nCollection.fieldLabel.description,
      localized: true,
      name: 'description',
      type: 'textarea',
    },
    adminSettingsField({ sidebar: true }),
  ],
  hooks: {
    beforeChange: [assignOrgToUploadBeforeChangeHook],
  },
  slug: 'media',
  upload: {
    imageSizes: [
      {
        height: 200,
        name: 'thumbnail',
        position: 'centre',
        width: 200,
      },
      {
        height: 1024,
        name: 'card',
        position: 'centre',
        width: 768,
      },
      {
        height: undefined,
        name: 'tablet',
        position: 'centre',
        width: 1024,
      },
    ],
    mimeTypes: ['image/*'],
  },
}
