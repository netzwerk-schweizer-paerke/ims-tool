import { Block } from 'payload'

import { I18nCollection } from '@/lib/i18n-collection'
import { trimGraphTextFieldHook } from '@/payload/collections/hooks/trim-graph-text-field-hook'
import { connectionSchema } from '@/payload/collections/json-schemas/connection-schema'
import { tabsMetadata } from '@/payload/collections/TaskFlow/blocks/tabs-metadata'

export const ProcessTaskInputOutputBlock: Block = {
  fields: [
    {
      admin: {
        className: 'process-task-io-block process-block-row',
      },
      fields: [
        {
          admin: {
            className: 'graph-fields-group',
          },
          fields: [
            {
              admin: {
                className: 'graph-fields-row',
              },
              fields: [
                {
                  admin: {
                    components: {
                      Field:
                        '@/components/graph/fields/graph/flows/io/process-input-output-field#ProcessInputOutputField',
                    },
                  },
                  hooks: {
                    beforeChange: [trimGraphTextFieldHook],
                  },
                  jsonSchema: connectionSchema,
                  name: 'io',
                  type: 'json',
                },
                {
                  admin: {
                    components: {
                      Field:
                        '@/components/graph/fields/graph/flows/task/process-task-field#ProcessTaskField',
                    },
                  },
                  hooks: {
                    beforeChange: [trimGraphTextFieldHook],
                  },
                  jsonSchema: connectionSchema,
                  name: 'task',
                  type: 'json',
                },
              ],
              type: 'row',
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
  imageAltText: 'Task with optional input/output',
  imageURL: '/process-block-shapes/block-start.svg',
  interfaceName: 'ProcessTaskIOBlock',
  labels: I18nCollection.blockLabel.taskWithOptionalIo,
  slug: 'proc-task-io',
}
