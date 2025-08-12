import { CollectionConfig } from 'payload'
import { I18nCollection } from '@/lib/i18n-collection'
import { isProduction } from '@/lib/environment'
import { authenticatedCollectionAccess } from '@/payload/collections/access/authenticated-collection-access'
import { mimeTypes } from '@/config/file-upload-mime'
import { addUsageInfoAfterReadHook } from '../Documents/hooks/add-usage-info'

export const DocumentsPublic: CollectionConfig = {
  slug: 'documents-public',
  labels: I18nCollection.collectionLabel.documentsPublic,
  admin: {
    hideAPIURL: isProduction,
    group: I18nCollection.collectionGroup.files,
  },
  access: {
    read: authenticatedCollectionAccess,
    create: authenticatedCollectionAccess,
    update: authenticatedCollectionAccess,
    delete: authenticatedCollectionAccess,
  },
  hooks: {
    afterRead: [addUsageInfoAfterReadHook],
  },
  upload: {
    mimeTypes,
  },
  fields: [
    {
      name: 'description',
      label: I18nCollection.fieldLabel.description,
      localized: true,
      type: 'textarea',
    },
    {
      name: 'itemType',
      type: 'text',
      virtual: true,
      defaultValue: 'documentsPublic',
    },
    // Virtual fields to display usage information
    {
      name: 'usageCount',
      type: 'number',
      virtual: true,
      admin: {
        position: 'sidebar',
        description: 'Number of places this document is used',
        readOnly: true,
      },
    },
    {
      name: 'usedIn',
      type: 'json',
      virtual: true,
      admin: {
        position: 'sidebar',
        description: 'Where this document is referenced',
        readOnly: true,
      },
    },
  ],
}
