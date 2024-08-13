import { CollectionConfig } from 'payload';
import { I18nCollection } from '@/lib/i18nCollection';
import { loggedInAccess } from '@/payload/collections/access/loggedInAccess';
import { assignOrgToUpload } from '@/payload/collections/hooks/assignOrgToUpload';

export const DocumentsPublic: CollectionConfig = {
  slug: 'documentsPublic',
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
  hooks: {
    beforeChange: [assignOrgToUpload],
  },
  upload: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
    ],
  },
  fields: [
    {
      name: 'description',
      label: I18nCollection.fieldLabel.description,
      localized: true,
      type: 'textarea',
    },
    // adminSettingsField({ sidebar: true }),
  ],
};
