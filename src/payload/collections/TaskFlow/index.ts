import { CollectionConfig } from 'payload'

import { isProduction } from '@/lib/environment'
import { I18nCollection } from '@/lib/i18n-collection'
import { currentOrganisationCollectionReadAccess } from '@/payload/collections/access/current-organisation-collection-read-access'
import { currentOrganisationCollectionWriteAccess } from '@/payload/collections/access/current-organisation-collection-write-access'
import { coerceRichTextFieldHook } from '@/payload/collections/hooks/coerce-rich-text-field-hook'
import { ProcessTaskInputOutputBlock } from '@/payload/collections/TaskFlow/blocks/task-input-output'
import { ProcessTaskParallelBlock } from '@/payload/collections/TaskFlow/blocks/task-parallel'
import { ProcessTestOutputBlock } from '@/payload/collections/TaskFlow/blocks/test-output'
import { adminSettingsField } from '@/payload/fields/admin-settings'
import { filesArrayField } from '@/payload/fields/files-array'
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced'

import { cloneTaskFlowTransactional } from './endpoints/clone-task-flow/clone-task-flow-transactional'

export const TaskFlows: CollectionConfig = {
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
          path: 'src/payload/collections/TaskFlow/components/clone-task-flows-button#CloneTaskFlowsButton',
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
  endpoints: [cloneTaskFlowTransactional],
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
      blocks: [ProcessTaskInputOutputBlock, ProcessTestOutputBlock, ProcessTaskParallelBlock],
      label: I18nCollection.fieldLabel.fragment,
      localized: true,
      name: 'blocks',
      type: 'blocks',
    },
    filesArrayField,
    adminSettingsField(),
  ],
  labels: {
    plural: I18nCollection.fieldLabel.taskFlows,
    singular: I18nCollection.fieldLabel.taskFlow,
  },
  slug: 'task-flows',
}
