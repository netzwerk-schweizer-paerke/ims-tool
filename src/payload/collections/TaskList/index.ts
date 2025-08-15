import { CollectionConfig } from 'payload'
import { I18nCollection } from '@/lib/i18n-collection'
import { isProduction } from '@/lib/environment'
import { adminSettingsField } from '@/payload/fields/admin-settings'
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced'
import { filesArrayField } from '@/payload/fields/files-array'
import { currentOrganisationCollectionReadAccess } from '@/payload/collections/access/current-organisation-collection-read-access'
import { currentOrganisationCollectionWriteAccess } from '@/payload/collections/access/current-organisation-collection-write-access'
import { cloneTaskListTransactional } from './endpoints/clone-task-list/clone-task-list-transactional'

export const TaskLists: CollectionConfig = {
  slug: 'task-lists',
  admin: {
    group: I18nCollection.collectionGroup.process,
    useAsTitle: 'name',
    hideAPIURL: isProduction,
    components: {
      beforeListTable: [
        {
          path: 'src/payload/collections/TaskList/components/clone-task-lists-button#CloneTaskListsButton',
        },
      ],
    },
  },
  endpoints: [cloneTaskListTransactional],
  labels: {
    plural: I18nCollection.fieldLabel.taskLists,
    singular: I18nCollection.fieldLabel.taskList,
  },
  access: {
    read: currentOrganisationCollectionReadAccess,
    create: currentOrganisationCollectionWriteAccess,
    update: currentOrganisationCollectionWriteAccess,
    delete: currentOrganisationCollectionWriteAccess,
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
    // This is temporary until payload-enchants/docs_reorder is updated
    {
      index: true,
      name: 'docOrder',
      type: 'number',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'items',
      label: I18nCollection.fieldLabel.listItem,
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'topic',
          label: I18nCollection.fieldLabel.topic,
          type: 'richText',
          editor: lexicalEditorReducedFeatures,
        },
        {
          name: 'tools',
          label: I18nCollection.fieldLabel.tools,
          type: 'richText',
          editor: lexicalEditorReducedFeatures,
        },
        {
          name: 'responsibility',
          label: I18nCollection.fieldLabel.responsibility,
          type: 'richText',
          editor: lexicalEditorReducedFeatures,
        },
      ],
    },
    filesArrayField,
    adminSettingsField({ sidebar: true }),
  ],
}
