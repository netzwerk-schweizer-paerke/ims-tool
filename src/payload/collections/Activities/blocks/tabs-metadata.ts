import { I18nCollection } from '@/lib/i18nCollection';
import { Field } from 'payload';
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced';

export const tabsMetadata: Field[] = [
  {
    type: 'tabs',
    tabs: [
      {
        name: 'relations',
        label: I18nCollection.fieldLabel.tasks,
        fields: [
          {
            name: 'flowRelation',
            type: 'relationship',
            label: I18nCollection.fieldLabel.taskFlows,
            relationTo: 'task-flows',
            hasMany: true,
          },
          {
            name: 'listRelation',
            type: 'relationship',
            label: I18nCollection.fieldLabel.taskLists,
            relationTo: 'task-lists',
            hasMany: true,
          },
        ],
      },
      {
        name: 'io',
        label: I18nCollection.fieldLabel.io,
        fields: [
          {
            name: 'input',
            label: I18nCollection.fieldLabel.input,
            type: 'richText',
            editor: lexicalEditorReducedFeatures,
          },
          {
            name: 'output',
            label: I18nCollection.fieldLabel.output,
            type: 'richText',
            editor: lexicalEditorReducedFeatures,
          },
        ],
      },
      {
        name: 'infos',
        label: I18nCollection.fieldLabel.activityInfos,
        fields: [
          {
            name: 'norms',
            label: I18nCollection.fieldLabel.normRequirements,
            type: 'richText',
            editor: lexicalEditorReducedFeatures,
          },
          {
            name: 'support',
            label: I18nCollection.fieldLabel.activitySupport,
            type: 'richText',
            editor: lexicalEditorReducedFeatures,
          },
        ],
      },
    ],
  },
];
