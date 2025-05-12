import { CollectionConfig } from 'payload'
import { I18nCollection } from '@/lib/i18nCollection'
import { authenticatedCollectionAccess } from '@/payload/collections/access/authenticated-collection-access'
import { mimeTypes } from '@/config/file-upload-mime'

export const DocumentsPublic: CollectionConfig = {
  slug: 'documents-public',
  labels: I18nCollection.collectionLabel.documentsPublic,
  admin: {
    hideAPIURL: true,
    group: I18nCollection.collectionGroup.files,
  },
  access: {
    read: authenticatedCollectionAccess,
    create: authenticatedCollectionAccess,
    update: authenticatedCollectionAccess,
    delete: authenticatedCollectionAccess,
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
  ],
}
