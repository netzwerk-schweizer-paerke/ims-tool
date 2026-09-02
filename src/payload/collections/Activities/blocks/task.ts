import { Block } from 'payload'

import { I18nCollection } from '@/lib/i18n-collection'
import { tabsMetadata } from '@/payload/collections/Activities/blocks/tabs-metadata'
import { connectionSchema } from '@/payload/collections/json-schemas/connection-schema'

export const ActivityTaskBlock: Block = {
  fields: [
    {
      admin: {
        className: 'task-group-io-block task-group-row',
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
                    'src/components/graph/fields/graph/activities/task/activity-task-field#ActivityTaskField',
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
  imageAltText: 'Task group',
  imageURL: '/process-block-shapes/task.svg',
  interfaceName: 'ActivityTaskBlock',
  labels: I18nCollection.blockLabel.taskGroup,
  slug: 'activity-task',
}
