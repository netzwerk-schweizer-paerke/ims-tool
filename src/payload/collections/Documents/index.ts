import { CollectionConfig } from 'payload'

import { mimeTypes } from '@/config/file-upload-mime'
import { isProduction } from '@/lib/environment'
import { I18nCollection } from '@/lib/i18n-collection'
import { currentOrganisationCollectionReadAccess } from '@/payload/collections/access/current-organisation-collection-read-access'
import { currentOrganisationCollectionWriteAccess } from '@/payload/collections/access/current-organisation-collection-write-access'
import { assignOrgToUploadBeforeChangeHook } from '@/payload/collections/hooks/assign-org-to-upload-before-change-hook'
import { adminSettingsField } from '@/payload/fields/admin-settings'

import { addUsageInfoAfterReadHook } from './hooks/add-usage-info'

export const Documents: CollectionConfig = {
  access: {
    create: currentOrganisationCollectionWriteAccess,
    delete: currentOrganisationCollectionWriteAccess,
    read: currentOrganisationCollectionReadAccess,
    update: currentOrganisationCollectionWriteAccess,
  },
  admin: {
    group: I18nCollection.collectionGroup.files,
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
    {
      defaultValue: 'documents',
      label: I18nCollection.fieldLabel.itemType,
      name: 'itemType',
      type: 'text',
      virtual: true,
    },
    adminSettingsField({ sidebar: true }),
    // Virtual fields to display usage information. `usedIn` renders the total as well, so
    // `usageCount` stays out of the admin UI. `admin.hidden` keeps it in the API response.
    {
      admin: {
        hidden: true,
      },
      name: 'usageCount',
      type: 'number',
      virtual: true,
    },
    {
      admin: {
        components: {
          Field: '@/payload/components/document-usage/document-usage-field#DocumentUsageField',
        },
        position: 'sidebar',
        readOnly: true,
      },
      name: 'usedIn',
      type: 'json',
      virtual: true,
    },
  ],
  hooks: {
    afterRead: [addUsageInfoAfterReadHook],
    beforeChange: [assignOrgToUploadBeforeChangeHook],
  },
  labels: I18nCollection.collectionLabel.documents,
  slug: 'documents',
  upload: {
    mimeTypes, // Use the configured MIME types for validation
  },
}
