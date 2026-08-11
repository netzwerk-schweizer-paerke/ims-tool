import { Field } from 'payload'

import { I18nCollection } from '@/lib/i18n-collection'
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced'

export const tabsMetadata: Field[] = [
  {
    tabs: [
      {
        fields: [
          {
            hasMany: true,
            label: I18nCollection.fieldLabel.tasks,
            name: 'tasks',
            relationTo: ['task-flows', 'task-lists'],
            type: 'relationship',
          },
        ],
        label: I18nCollection.fieldLabel.tasks,
        name: 'relations',
      },
      {
        fields: [
          {
            editor: lexicalEditorReducedFeatures,
            label: I18nCollection.fieldLabel.input,
            name: 'input',
            type: 'richText',
          },
          {
            editor: lexicalEditorReducedFeatures,
            label: I18nCollection.fieldLabel.output,
            name: 'output',
            type: 'richText',
          },
        ],
        label: I18nCollection.fieldLabel.io,
        name: 'io',
      },
      {
        fields: [
          {
            editor: lexicalEditorReducedFeatures,
            label: I18nCollection.fieldLabel.normRequirements,
            name: 'norms',
            type: 'richText',
          },
          {
            editor: lexicalEditorReducedFeatures,
            label: I18nCollection.fieldLabel.activitySupport,
            name: 'support',
            type: 'richText',
          },
        ],
        label: I18nCollection.fieldLabel.activityInfos,
        name: 'infos',
      },
    ],
    type: 'tabs',
  },
]
