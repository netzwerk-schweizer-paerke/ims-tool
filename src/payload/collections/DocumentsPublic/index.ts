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
      name: 'itemType',
      type: 'text',
      virtual: true,
    },
    // Virtual fields to display usage information
    {
      admin: {
        description: 'Number of places this document is used',
        position: 'sidebar',
        readOnly: true,
      },
      name: 'usageCount',
      type: 'number',
      virtual: true,
    },
    {
      admin: {
        description: 'Where this document is referenced',
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
