import { CollectionConfig } from 'payload/types';
import path from 'path';
import { translations } from '@/lib/translations';

export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: {
    group: translations.collectionGroup.files,
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
      name: 'alt',
      type: 'text',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      access: {
        update: () => false,
      },
    },
  ],
};
