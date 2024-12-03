import { Block } from 'payload'
import { tabsMetadata } from '@/payload/collections/Activities/blocks/tabs-metadata'
import { connectionSchema } from '@/payload/collections/json-schemas/connection-schema'

export const ActivityTaskBlock: Block = {
  slug: 'activity-task',
  labels: {
    singular: 'Task group',
    plural: 'Task groups',
  },
  imageURL: '/process-block-shapes/task.svg',
  imageAltText: 'Task group',
  interfaceName: 'ActivityTaskBlock',
  fields: [
    {
      type: 'row',
      admin: {
        className: 'task-group-io-block task-group-row',
      },
      fields: [
        {
          type: 'group',
          name: 'graph',
          label: false,
          admin: {
            className: 'graph-fields-group',
          },
          fields: [
            {
              name: 'task',
              type: 'json',
              admin: {
                components: {
                  Field:
                    'src/components/graph/fields/graph/activities/task/activity-task-field#ActivityTaskField',
                },
                hidden: true,
              },
              jsonSchema: connectionSchema,
            },
          ],
        },
        ...tabsMetadata,
      ],
    },
  ],
}
