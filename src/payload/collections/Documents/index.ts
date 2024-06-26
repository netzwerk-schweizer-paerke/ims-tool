import { CollectionConfig } from 'payload';
import path from 'path';
import { translations } from '@/lib/translations';
import { organisationsAccess } from '@/payload/collections/access/organisationsAccess';
import { loggedInAccess } from '@/payload/collections/access/loggedInAccess';
import { organisationAdminsAccess } from '@/payload/collections/access/organisationAdminsAccess';
import { adminSettingsField } from '@/payload/fields/admin-settings';

export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: {
    group: translations.collectionGroup.files,
  },
  access: {
    read: organisationsAccess,
    create: loggedInAccess,
    update: organisationAdminsAccess,
    delete: organisationAdminsAccess,
  },
  upload: {
    staticDir: path.resolve('./public/documents'),
    disableLocalStorage: true,
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
    ],
  },
  fields: [
    {
      name: 'name',
      label: translations.fieldLabel.name,
      localized: true,
      type: 'text',
    },
    {
      name: 'description',
      label: translations.fieldLabel.description,
      localized: true,
      type: 'textarea',
    },
    adminSettingsField({ sidebar: true }),
  ],
};
