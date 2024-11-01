import { CollectionConfig } from 'payload';
import { I18nCollection } from '@/lib/i18nCollection';
import { loggedInAccess } from '@/payload/collections/access/loggedInAccess';
import { mimeTypes } from '@/config/file-upload-mime';

export const DocumentsPublic: CollectionConfig = {
  slug: 'documents-public',
  labels: I18nCollection.collectionLabel.documentsPublic,
  admin: {
    group: I18nCollection.collectionGroup.files,
  },
  access: {
    read: loggedInAccess,
    create: loggedInAccess,
    update: loggedInAccess,
    delete: loggedInAccess,
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
};
