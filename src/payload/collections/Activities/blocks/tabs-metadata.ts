import { translations } from '@/lib/translations';
import { Field } from 'payload';
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced';
import { filesArrayField } from '@/payload/fields/files-array';

export const tabsMetadata: Field[] = [
  {
    type: 'tabs',
    tabs: [
      {
        name: 'relations',
        label: translations.fieldLabel.taskFlows,
        fields: [
          {
            name: 'relation',
            type: 'relationship',
            label: translations.fieldLabel.taskFlows,
            relationTo: 'task-flows',
            hasMany: true,
          },
        ],
      },
      {
        name: 'io',
        label: translations.fieldLabel.tools,
        fields: [
          {
            name: 'input',
            label: translations.fieldLabel.input,
            type: 'richText',
            localized: true,
            editor: lexicalEditorReducedFeatures,
          },
          {
            name: 'output',
            label: translations.fieldLabel.output,
            type: 'richText',
            localized: true,
            editor: lexicalEditorReducedFeatures,
          },
        ],
      },
      {
        name: 'infos',
        label: translations.fieldLabel.activityInfos,
        fields: [
          {
            name: 'norms',
            label: translations.fieldLabel.normRequirements,
            type: 'richText',
            localized: true,
            editor: lexicalEditorReducedFeatures,
          },
          {
            name: 'support',
            label: translations.fieldLabel.activitySupport,
            type: 'richText',
            localized: true,
            editor: lexicalEditorReducedFeatures,
          },
        ],
      },
      {
        name: 'files',
        label: translations.fieldLabel.attachments,
        fields: [filesArrayField],
      },
    ],
  },
];
