import { CollectionConfig } from 'payload'

import { mimeTypes } from '@/config/file-upload-mime'
import { isProduction } from '@/lib/environment'
import { I18nCollection } from '@/lib/i18n-collection'
import { authenticatedCollectionAccess } from '@/payload/collections/access/authenticated-collection-access'

import { addUsageInfoAfterReadHook } from '../Documents/hooks/add-usage-info'

export const DocumentsPublic: CollectionConfig = {
  access: {
    create: authenticatedCollectionAccess,
    delete: authenticatedCollectionAccess,
    read: authenticatedCollectionAccess,
    update: authenticatedCollectionAccess,
  },
  admin: {
    group: I18nCollection.collectionGroup.files,
    hideAPIURL: isProduction,
  },
  fields: [
    {
      label: I18nCollection.fieldLabel.description,
      localized: true,
      name: 'description',
      type: 'textarea',
    },
    {
      defaultValue: 'documentsPublic',
      label: I18nCollection.fieldLabel.itemType,
      name: 'itemType',
      type: 'text',
      virtual: true,
    },
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
  },
  labels: I18nCollection.collectionLabel.documentsPublic,
  slug: 'documents-public',
  upload: {
    mimeTypes,
  },
}
