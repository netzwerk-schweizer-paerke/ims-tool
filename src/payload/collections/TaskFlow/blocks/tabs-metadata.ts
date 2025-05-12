import { I18nCollection } from '@/lib/i18n-collection'
import { Field } from 'payload'
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced'

export const tabsMetadata: Field[] = [
  {
    type: 'tabs',
    tabs: [
      {
        name: 'keypoints',
        label: I18nCollection.fieldLabel.keypoints,
        fields: [
          {
            name: 'keypoints',
            label: false,
            type: 'richText',
            editor: lexicalEditorReducedFeatures,
          },
        ],
      },
      {
        name: 'tools',
        label: I18nCollection.fieldLabel.tools,
        fields: [
          {
            name: 'tools',
            label: false,
            type: 'richText',
            editor: lexicalEditorReducedFeatures,
          },
        ],
      },
      {
        name: 'responsibility',
        label: I18nCollection.fieldLabel.responsibility,
        fields: [
          {
            name: 'responsibility',
            label: false,
            type: 'richText',
            editor: lexicalEditorReducedFeatures,
          },
        ],
      },
    ],
  },
]
