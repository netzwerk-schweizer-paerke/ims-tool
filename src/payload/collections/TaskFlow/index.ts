import { CollectionConfig } from 'payload';
import { I18nCollection } from '@/lib/i18nCollection';
import { organisationsAccess } from '@/payload/collections/access/organisationsAccess';
import { loggedInAccess } from '@/payload/collections/access/loggedInAccess';
import { organisationAdminsAccess } from '@/payload/collections/access/organisationAdminsAccess';
import { ProcessTaskInputOutputBlock } from '@/payload/collections/TaskFlow/blocks/task-input-output';
import { ProcessTestOutputBlock } from '@/payload/collections/TaskFlow/blocks/test-output';
import { adminSettingsField } from '@/payload/fields/admin-settings';
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced';
import { filesArrayField } from '@/payload/fields/files-array';

export const TaskFlows: CollectionConfig = {
  slug: 'task-flows',
  admin: {
    group: I18nCollection.collectionGroup.process,
    useAsTitle: 'name',
  },
  labels: {
    plural: I18nCollection.fieldLabel.taskFlows,
    singular: I18nCollection.fieldLabel.taskFlow,
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
      label: I18nCollection.fieldLabel.fragment,
      localized: true,
      type: 'blocks',
      blocks: [ProcessTaskInputOutputBlock, ProcessTestOutputBlock],
    },
    filesArrayField,
    adminSettingsField(),
  ],
};
