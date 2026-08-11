import { Field } from 'payload'

import { I18nCollection } from '@/lib/i18n-collection'

export const filesArrayField: Field = {
  admin: {
    description: I18nCollection.fieldDescription.filesArray,
  },
  fields: [
    {
      admin: {
        description: I18nCollection.fieldDescription.file,
      },
      label: I18nCollection.fieldLabel.file,
      localized: true,
      name: 'document',
      relationTo: 'documents',
      type: 'relationship',
    },
  ],
  label: false,
  name: 'files',
  type: 'array',
}
