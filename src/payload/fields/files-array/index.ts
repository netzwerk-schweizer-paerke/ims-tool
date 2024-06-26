import { translations } from '@/lib/translations';
import { Field } from 'payload';

export const filesArrayField: Field = {
  name: 'files',
  type: 'array',
  label: false,
  admin: {
    description: translations.fieldDescription.filesArray,
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'file',
      admin: { isClearable: false },
      options: [
        {
          label: translations.fieldLabel.file,
          value: 'file',
        },
        {
          label: translations.fieldLabel.link,
          value: 'link',
        },
      ],
    },
    {
      name: 'name',
      type: 'text',
      localized: true,
      label: translations.fieldLabel.displayName,
    },
    {
      name: 'document',
      type: 'relationship',
      label: translations.fieldLabel.file,
      relationTo: 'documents',
      localized: true,
      admin: {
        description: translations.fieldDescription.file,
        condition: (data, siblingData) => {
          return siblingData.type === 'file';
        },
      },
    },
    {
      name: 'url',
      type: 'text',
      label: translations.fieldLabel.externalUrl,
      localized: true,
      admin: {
        description: translations.fieldDescription.externalUrl,
        condition: (data, siblingData) => {
          return siblingData.type === 'link';
        },
      },
    },
  ],
};
