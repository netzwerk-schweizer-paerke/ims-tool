import { Block } from 'payload'
import { tabsMetadata } from '@/payload/collections/TaskFlow/blocks/tabs-metadata'
import { connectionSchema } from '@/payload/collections/json-schemas/connection-schema'

export const ProcessTaskParallelBlock: Block = {
  slug: 'proc-task-p',
  labels: {
    singular: 'Two parallel tasks',
    plural: 'Two parallel tasks',
  },
  imageURL: '/process-block-shapes/block-parallel.svg',
  imageAltText: 'Two parallel tasks',
  interfaceName: 'ProcessTaskParallelBlock',
  fields: [
    {
      type: 'row',
      admin: {
        className: 'process-task-parallel-block process-block-row',
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
              type: 'row',
              admin: {
                className: 'graph-fields-row',
              },
              fields: [
                {
                  name: 'task',
                  type: 'json',
                  admin: {
                    components: {
                      Field:
                        'src/components/graph/fields/graph/flows/parallel/process-task-parallel-field#ProcessTaskParallelField',
                    },
                    hidden: true,
                  },
                  jsonSchema: connectionSchema,
                },
              ],
            },
          ],
        },
        ...tabsMetadata,
      ],
    },
  ],
}
