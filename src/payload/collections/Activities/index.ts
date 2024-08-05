import { CollectionConfig } from 'payload';
import { I18nCollection } from '@/lib/i18nCollection';
import { organisationsAccess } from '@/payload/collections/access/organisationsAccess';
import { loggedInAccess } from '@/payload/collections/access/loggedInAccess';
import { organisationAdminsAccess } from '@/payload/collections/access/organisationAdminsAccess';
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced';
import { adminSettingsField } from '@/payload/fields/admin-settings';
import { ActivityTaskBlock } from '@/payload/collections/Activities/blocks/task';
import { ActivityIOBlock } from '@/payload/collections/Activities/blocks/input-output';
import { filesArrayField } from '@/payload/fields/files-array';

export const Activities: CollectionConfig = {
  slug: 'activities',
  admin: {
    group: I18nCollection.collectionGroup.process,
    useAsTitle: 'name',
  },
  labels: {
    plural: I18nCollection.fieldLabel.activities,
    singular: I18nCollection.fieldLabel.activity,
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
      label: I18nCollection.fieldLabel.name,
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'description',
      label: I18nCollection.fieldLabel.description,
      type: 'richText',
      localized: true,
      editor: lexicalEditorReducedFeatures,
    },
    {
      name: 'blocks',
      label: I18nCollection.fieldLabel.blocks,
      type: 'blocks',
      localized: true,
      blocks: [ActivityIOBlock, ActivityTaskBlock],
    },
    filesArrayField,
    {
      name: 'variant',
      label: I18nCollection.fieldLabel.variant,
      type: 'select',
      required: true,
      admin: {
        position: 'sidebar',
      },
      options: [
        {
          label: I18nCollection.fieldLabel.standard,
          value: 'standard',
        },
        {
          label: I18nCollection.fieldLabel.supportActivities,
          value: 'supportActivity',
        },
        {
          label: I18nCollection.fieldLabel.strategyActivities,
          value: 'strategyActivity',
        },
      ],
    },
    adminSettingsField({ sidebar: true }),
  ],
};
