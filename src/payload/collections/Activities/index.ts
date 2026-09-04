import { CollectionConfig } from 'payload'

import { isProduction } from '@/lib/environment'
import { I18nCollection } from '@/lib/i18n-collection'
import { currentOrganisationCollectionReadAccess } from '@/payload/collections/access/current-organisation-collection-read-access'
import { currentOrganisationCollectionWriteAccess } from '@/payload/collections/access/current-organisation-collection-write-access'
import { ActivityIOBlock } from '@/payload/collections/Activities/blocks/input-output'
import { ActivityTaskBlock } from '@/payload/collections/Activities/blocks/task'
import { cloneActivityTransactional } from '@/payload/collections/Activities/endpoints/clone/clone-activity-transactional'
import { fetchLegacyDocsTransactional } from '@/payload/collections/Activities/endpoints/legacy-fetcher/fetch-legacy-docs-transactional'
import { coerceRichTextFieldHook } from '@/payload/collections/hooks/coerce-rich-text-field-hook'
import { adminSettingsField } from '@/payload/fields/admin-settings'
import { filesArrayField } from '@/payload/fields/files-array'
import { lexicalEditorReducedFeatures } from '@/payload/utilities/lexical-editors/reduced'

export const Activities: CollectionConfig = {
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
          path: '@/payload/collections/Activities/components/before-list-table-wrapper#BeforeListTableWrapper',
        },
      ],
      edit: {
        beforeDocumentControls: [
          {
            path: '@/payload/components/health/document-health-button#DocumentHealthButton',
          },
        ],
      },
    },
    group: I18nCollection.collectionGroup.process,
    hideAPIURL: isProduction,
    useAsTitle: 'name',
  },
  endpoints: [cloneActivityTransactional, fetchLegacyDocsTransactional],
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
    {
      label: I18nCollection.fieldLabel.variant,
      name: 'variant',
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
      required: true,
      type: 'select',
    },
    // This is temporary until payload-enchants/docs_reorder is updated
    {
      index: true,
      label: I18nCollection.fieldLabel.order,
      name: 'docOrder',
      type: 'number',
    },
    {
      blocks: [ActivityIOBlock, ActivityTaskBlock],
      label: I18nCollection.fieldLabel.blocks,
      localized: true,
      name: 'blocks',
      type: 'blocks',
    },
    filesArrayField,
    adminSettingsField(),
  ],
  labels: {
    plural: I18nCollection.fieldLabel.activities,
    singular: I18nCollection.fieldLabel.activity,
  },
  slug: 'activities',
}
