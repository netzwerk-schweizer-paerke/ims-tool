import { CollectionConfig } from 'payload';
import { translations } from '@/lib/translations';
import { organisationsAccess } from '@/payload/collections/access/organisationsAccess';
import { loggedInAccess } from '@/payload/collections/access/loggedInAccess';
import { organisationAdminsAccess } from '@/payload/collections/access/organisationAdminsAccess';
import { ProcessTaskInputOutputBlock } from '@/payload/collections/TaskFlow/blocks/task-input-output';
import { ProcessTestOutputBlock } from '@/payload/collections/TaskFlow/blocks/test-output';
import { adminSettingsField } from '@/payload/fields/admin-settings';
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced';

export const TaskFlows: CollectionConfig = {
  slug: 'task-flows',
  admin: {
    group: translations.collectionGroup.process,
    useAsTitle: 'name',
  },
  labels: {
    plural: translations.fieldLabel.taskFlows,
    singular: translations.fieldLabel.taskFlow,
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
      label: translations.fieldLabel.fragment,
      localized: true,
      type: 'blocks',
      blocks: [ProcessTaskInputOutputBlock, ProcessTestOutputBlock],
    },
    adminSettingsField(),
  ],
};
