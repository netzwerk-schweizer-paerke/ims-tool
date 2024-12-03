import { Block } from 'payload'
import { tabsMetadata } from '@/payload/collections/TaskFlow/blocks/tabs-metadata'
import { connectionSchema } from '@/payload/collections/json-schemas/connection-schema'

export const ProcessTaskInputOutputBlock: Block = {
  slug: 'proc-task-io',
  labels: {
    singular: 'Task with optional input/output',
    plural: 'TaskFlows with optional input/output',
  },
  imageURL: '/process-block-shapes/block-start.svg',
  imageAltText: 'Task with optional input/output',
  interfaceName: 'ProcessTaskIOBlock',
  fields: [
    {
      type: 'row',
      admin: {
        className: 'process-task-io-block process-block-row',
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
                  name: 'io',
                  type: 'json',
                  admin: {
                    components: {
                      Field:
                        'src/components/graph/fields/graph/flows/io/process-input-output-field#ProcessInputOutputField',
                    },
                    hidden: true,
                  },
                  jsonSchema: connectionSchema,
                },
                {
                  name: 'task',
                  type: 'json',
                  admin: {
                    components: {
                      Field:
                        'src/components/graph/fields/graph/flows/task/process-task-field#ProcessTaskField',
                    },
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
