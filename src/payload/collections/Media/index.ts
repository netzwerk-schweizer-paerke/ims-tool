import { CollectionConfig } from 'payload';
import path from 'path';
import { translations } from '@/lib/translations';
import { organisationsAccess } from '@/payload/collections/access/organisationsAccess';
import { loggedInAccess } from '@/payload/collections/access/loggedInAccess';
import { organisationAdminsAccess } from '@/payload/collections/access/organisationAdminsAccess';
import { adminSettingsField } from '@/payload/fields/admin-settings';

export const Media: CollectionConfig = {
  slug: 'media',
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
    staticDir: path.resolve('./public/media'),
    disableLocalStorage: true,
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
