import { CollectionConfig } from 'payload'
import { I18nCollection } from '@/lib/i18n-collection'
import { currentOrganisationCollectionAccess } from '@/payload/collections/access/current-organisation-collection-access'
import { organisationAdminsCollectionAccess } from '@/payload/collections/access/organisation-admin-collection-access'
import { ProcessTaskInputOutputBlock } from '@/payload/collections/TaskFlow/blocks/task-input-output'
import { ProcessTestOutputBlock } from '@/payload/collections/TaskFlow/blocks/test-output'
import { adminSettingsField } from '@/payload/fields/admin-settings'
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced'
import { filesArrayField } from '@/payload/fields/files-array'
import { ProcessTaskParallelBlock } from '@/payload/collections/TaskFlow/blocks/task-parallel'

export const TaskFlows: CollectionConfig = {
  slug: 'task-flows',
  admin: {
    hideAPIURL: true,
    group: I18nCollection.collectionGroup.process,
    useAsTitle: 'name',
  },
  labels: {
    plural: I18nCollection.fieldLabel.taskFlows,
    singular: I18nCollection.fieldLabel.taskFlow,
  },
  access: {
    read: currentOrganisationCollectionAccess,
    create: organisationAdminsCollectionAccess,
    update: organisationAdminsCollectionAccess,
    delete: organisationAdminsCollectionAccess,
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
      name: 'blocks',
      label: I18nCollection.fieldLabel.fragment,
      localized: true,
      type: 'blocks',
      blocks: [ProcessTaskInputOutputBlock, ProcessTestOutputBlock, ProcessTaskParallelBlock],
    },
    filesArrayField,
    adminSettingsField(),
  ],
}
