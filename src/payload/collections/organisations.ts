import { CollectionConfig } from 'payload/types';
import { translations } from '@/lib/translations';

export const Organisations: CollectionConfig = {
  slug: 'organisations',
  labels: {
    plural: translations.fieldLabel.organisations,
    singular: translations.fieldLabel.organisation,
  },
  admin: {
    group: translations.collectionGroup.settings,
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      label: translations.fieldLabel.name,
      type: 'text',
      required: true,
    },
    {
      name: 'logo',
      label: translations.fieldLabel.logo,
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'users',
      label: translations.fieldLabel.users,
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
    },
  ],
};
