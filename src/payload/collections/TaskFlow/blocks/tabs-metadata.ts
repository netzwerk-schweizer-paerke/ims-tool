import { translations } from '@/lib/translations';
import { Field } from 'payload';
import { filesArrayField } from '@/payload/fields/files-array';
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced';

export const tabsMetadata: Field[] = [
  {
    type: 'tabs',
    tabs: [
      {
        name: 'keypoints-tab',
        label: translations.fieldLabel.keypoints,
        fields: [
          {
            name: 'keypoints',
            label: false,
            type: 'richText',
            localized: true,
            editor: lexicalEditorReducedFeatures,
          },
        ],
      },
      {
        name: 'tools-tab',
        label: translations.fieldLabel.tools,
        fields: [
          {
            name: 'tools',
            label: false,
            type: 'richText',
            localized: true,
            editor: lexicalEditorReducedFeatures,
          },
        ],
      },
      {
        name: 'responsibility-tab',
        label: translations.fieldLabel.responsibility,
        fields: [
          {
            name: 'responsibility',
            label: false,
            type: 'richText',
            localized: true,
            editor: lexicalEditorReducedFeatures,
          },
        ],
      },
      {
        name: 'file-tab',
        label: translations.fieldLabel.attachments,
        fields: [filesArrayField],
      },
    ],
  },
];
