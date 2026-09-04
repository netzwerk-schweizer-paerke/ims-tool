import { CollectionConfig } from 'payload'

import { isProduction } from '@/lib/environment'
import { I18nCollection } from '@/lib/i18n-collection'
import { currentOrganisationCollectionReadAccess } from '@/payload/collections/access/current-organisation-collection-read-access'
import { currentOrganisationCollectionWriteAccess } from '@/payload/collections/access/current-organisation-collection-write-access'
import { coerceRichTextFieldHook } from '@/payload/collections/hooks/coerce-rich-text-field-hook'
import { adminSettingsField } from '@/payload/fields/admin-settings'
import { filesArrayField } from '@/payload/fields/files-array'
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced'

import { cloneTaskListTransactional } from './endpoints/clone-task-list/clone-task-list-transactional'

export const TaskLists: CollectionConfig = {
  access: {
    create: currentOrganisationCollectionWriteAccess,
    delete: currentOrganisationCollectionWriteAccess,
    read: currentOrganisationCollectionReadAccess,
    update: currentOrganisationCollectionWriteAccess,
  },
  admin: {
    components: {
      beforeListTable: [
        {
          path: 'src/payload/collections/TaskList/components/clone-task-lists-button#CloneTaskListsButton',
        },
      ],
      edit: {
        beforeDocumentControls: [
          {
            path: 'src/payload/components/health/document-health-button.tsx#DocumentHealthButton',
          },
        ],
      },
    },
    group: I18nCollection.collectionGroup.process,
    hideAPIURL: isProduction,
    useAsTitle: 'name',
  },
  endpoints: [cloneTaskListTransactional],
  fields: [
    {
      label: I18nCollection.fieldLabel.name,
      localized: true,
      name: 'name',
      required: true,
      type: 'text',
    },
    {
      editor: lexicalEditorReducedFeatures,
      hooks: { beforeChange: [coerceRichTextFieldHook] },
      label: I18nCollection.fieldLabel.description,
      localized: true,
      name: 'description',
      type: 'richText',
    },
    // This is temporary until payload-enchants/docs_reorder is updated
    {
      admin: {
        hidden: true,
      },
      index: true,
      name: 'docOrder',
      type: 'number',
    },
    {
      fields: [
        {
          editor: lexicalEditorReducedFeatures,
          hooks: { beforeChange: [coerceRichTextFieldHook] },
          label: I18nCollection.fieldLabel.topic,
          name: 'topic',
          type: 'richText',
        },
        {
          editor: lexicalEditorReducedFeatures,
          hooks: { beforeChange: [coerceRichTextFieldHook] },
          label: I18nCollection.fieldLabel.tools,
          name: 'tools',
          type: 'richText',
        },
        {
          editor: lexicalEditorReducedFeatures,
          hooks: { beforeChange: [coerceRichTextFieldHook] },
          label: I18nCollection.fieldLabel.responsibility,
          name: 'responsibility',
          type: 'richText',
        },
      ],
      label: I18nCollection.fieldLabel.listItem,
      localized: true,
      name: 'items',
      type: 'array',
    },
    filesArrayField,
    adminSettingsField({ sidebar: true }),
  ],
  labels: {
    plural: I18nCollection.fieldLabel.taskLists,
    singular: I18nCollection.fieldLabel.taskList,
  },
  slug: 'task-lists',
}
