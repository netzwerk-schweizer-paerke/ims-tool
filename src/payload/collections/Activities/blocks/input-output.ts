import { Block } from 'payload'

import { I18nCollection } from '@/lib/i18n-collection'
import { tabsMetadata } from '@/payload/collections/Activities/blocks/tabs-metadata'
import { connectionSchema } from '@/payload/collections/json-schemas/connection-schema'

export const ActivityIOBlock: Block = {
  fields: [
    {
      admin: {
        className: 'activity-io-block task-group-row',
      },
      fields: [
        {
          admin: {
            className: 'graph-fields-group',
          },
          fields: [
            {
              admin: {
                components: {
                  Field:
                    'src/components/graph/fields/graph/activities/io/activity-i-o-field#ActivityIOField',
                },
              },
              jsonSchema: connectionSchema,
              name: 'task',
              type: 'json',
            },
          ],
          label: false,
          name: 'graph',
          type: 'group',
        },
        ...tabsMetadata,
      ],
      type: 'row',
    },
  ],
  imageAltText: 'Input/output task group',
  imageURL: '/process-block-shapes/input-output.svg',
  interfaceName: 'ActivityIOBlock',
  labels: I18nCollection.blockLabel.inputOutputTaskGroup,
  slug: 'activity-io',
}
