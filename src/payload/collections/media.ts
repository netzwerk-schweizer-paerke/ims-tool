import { CollectionConfig } from 'payload/types';
import path from 'path';
import { translations } from '@/lib/translations';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: translations.collectionGroup.files,
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
