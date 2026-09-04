import { Field } from 'payload'

import { I18nCollection } from '@/lib/i18n-collection'
import { coerceRichTextFieldHook } from '@/payload/collections/hooks/coerce-rich-text-field-hook'
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced'

export const tabsMetadata: Field[] = [
  {
    tabs: [
      {
        fields: [
          {
            editor: lexicalEditorReducedFeatures,
            hooks: { beforeChange: [coerceRichTextFieldHook] },
            label: false,
            name: 'keypoints',
            type: 'richText',
          },
        ],
        label: I18nCollection.fieldLabel.keypoints,
        name: 'keypoints',
      },
      {
        fields: [
          {
            editor: lexicalEditorReducedFeatures,
            hooks: { beforeChange: [coerceRichTextFieldHook] },
            label: false,
            name: 'tools',
            type: 'richText',
          },
        ],
        label: I18nCollection.fieldLabel.tools,
        name: 'tools',
      },
      {
        fields: [
          {
            editor: lexicalEditorReducedFeatures,
            hooks: { beforeChange: [coerceRichTextFieldHook] },
            label: false,
            name: 'responsibility',
            type: 'richText',
          },
        ],
        label: I18nCollection.fieldLabel.responsibility,
        name: 'responsibility',
      },
    ],
    type: 'tabs',
  },
]
