import { CollectionConfig } from 'payload';
import { translations } from '@/lib/translations';
import { organisationsAccess } from '@/payload/collections/access/organisationsAccess';
import { loggedInAccess } from '@/payload/collections/access/loggedInAccess';
import { organisationAdminsAccess } from '@/payload/collections/access/organisationAdminsAccess';
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced';
import { adminSettingsField } from '@/payload/fields/admin-settings';
import { ActivityTaskBlock } from '@/payload/collections/Activities/blocks/task';
import { ActivityIOBlock } from '@/payload/collections/Activities/blocks/input-output';

export const Activities: CollectionConfig = {
  slug: 'activities',
  admin: {
    group: translations.collectionGroup.process,
    useAsTitle: 'name',
  },
  labels: {
    plural: translations.fieldLabel.activities,
    singular: translations.fieldLabel.activity,
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
      name: 'blocks',
      label: translations.fieldLabel.blocks,
      type: 'blocks',
      localized: true,
      blocks: [ActivityIOBlock, ActivityTaskBlock],
    },
    {
      name: 'variant',
      label: translations.fieldLabel.variant,
      type: 'select',
      required: true,
      admin: {
        position: 'sidebar',
      },
      options: [
        {
          label: translations.fieldLabel.standard,
          value: 'standard',
        },
        {
          label: translations.fieldLabel.supportActivities,
          value: 'group',
        },
      ],
    },
    adminSettingsField({ sidebar: true }),
  ],
};
