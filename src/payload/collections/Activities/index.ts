import { CollectionConfig } from 'payload'
import { I18nCollection } from '@/lib/i18n-collection'
import { isProduction } from '@/lib/environment'
import { currentOrganisationCollectionReadAccess } from '@/payload/collections/access/current-organisation-collection-read-access'
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced'
import { adminSettingsField } from '@/payload/fields/admin-settings'
import { ActivityTaskBlock } from '@/payload/collections/Activities/blocks/task'
import { ActivityIOBlock } from '@/payload/collections/Activities/blocks/input-output'
import { filesArrayField } from '@/payload/fields/files-array'
import { currentOrganisationCollectionWriteAccess } from '@/payload/collections/access/current-organisation-collection-write-access'
import { cloneActivityTransactional } from '@/payload/collections/Activities/endpoints/clone-activity/clone-activity-transactional'

export const Activities: CollectionConfig = {
  slug: 'activities',
  admin: {
    group: I18nCollection.collectionGroup.process,
    hideAPIURL: isProduction,
    useAsTitle: 'name',
    components: {
      beforeListTable: [
        {
          path: 'src/payload/collections/Activities/components/clone-activity-button#CloneActivityButton',
        },
      ],
    },
  },
  labels: {
    plural: I18nCollection.fieldLabel.activities,
    singular: I18nCollection.fieldLabel.activity,
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
    {
      name: 'variant',
      label: I18nCollection.fieldLabel.variant,
      type: 'select',
      required: true,
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
    // This is temporary until payload-enchants/docs_reorder is updated
    {
      index: true,
      name: 'docOrder',
      type: 'number',
    },
    {
      name: 'blocks',
      label: I18nCollection.fieldLabel.blocks,
      type: 'blocks',
      localized: true,
      blocks: [ActivityIOBlock, ActivityTaskBlock],
    },
    filesArrayField,
    adminSettingsField(),
  ],
  endpoints: [cloneActivityTransactional],
}
