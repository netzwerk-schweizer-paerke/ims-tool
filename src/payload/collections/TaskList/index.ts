import { CollectionConfig } from 'payload';
import { translations } from '@/lib/translations';
import { organisationsAccess } from '@/payload/collections/access/organisationsAccess';
import { loggedInAccess } from '@/payload/collections/access/loggedInAccess';
import { organisationAdminsAccess } from '@/payload/collections/access/organisationAdminsAccess';
import { adminSettingsField } from '@/payload/fields/admin-settings';
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced';
import { filesArrayField } from '@/payload/fields/files-array';

export const TaskLists: CollectionConfig = {
  slug: 'task-lists',
  admin: {
    group: translations.collectionGroup.process,
    useAsTitle: 'name',
  },
  labels: {
    plural: translations.fieldLabel.taskLists,
    singular: translations.fieldLabel.taskList,
  },
  access: {
    read: organisationsAccess,
    create: loggedInAccess,
    update: organisationAdminsAccess,
    delete: organisationAdminsAccess,
  },
  fields: [
    {
      name: 'name',
      label: translations.fieldLabel.name,
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'description',
      label: translations.fieldLabel.description,
      type: 'richText',
      localized: true,
      editor: lexicalEditorReducedFeatures,
    },
    {
      name: 'items',
      label: translations.fieldLabel.listItem,
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'topic',
          label: translations.fieldLabel.topic,
          type: 'richText',
          localized: true,
          editor: lexicalEditorReducedFeatures,
        },
        {
          name: 'tools',
          label: translations.fieldLabel.tools,
          type: 'richText',
          localized: true,
          editor: lexicalEditorReducedFeatures,
        },
        {
          name: 'responsibility',
          label: translations.fieldLabel.responsibility,
          type: 'richText',
          localized: true,
          editor: lexicalEditorReducedFeatures,
        },
        filesArrayField,
      ],
    },
    adminSettingsField({ sidebar: true }),
  ],
};
