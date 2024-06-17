import { CollectionConfig } from 'payload/types';
import { isAdminOrOwnUser } from '../access/isAdminOrOwnUser';
import { translations } from '@/lib/translations';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    group: translations.collectionGroup.settings,
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      options: [
        {
          label: translations.roles.admin,
          value: 'admin',
        },
        {
          label: translations.roles.user,
          value: 'user',
        },
      ],
      required: true,
      label: translations.fieldLabel.role,
    },
  ],
  access: {
    read: isAdminOrOwnUser,
    update: isAdminOrOwnUser,
    delete: isAdminOrOwnUser,
  },
};
