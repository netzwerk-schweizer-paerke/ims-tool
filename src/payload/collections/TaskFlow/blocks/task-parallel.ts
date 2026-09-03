import { Block } from 'payload'

import { I18nCollection } from '@/lib/i18n-collection'
import { trimGraphTextFieldHook } from '@/payload/collections/hooks/trim-graph-text-field-hook'
import { connectionSchema } from '@/payload/collections/json-schemas/connection-schema'
import { tabsMetadata } from '@/payload/collections/TaskFlow/blocks/tabs-metadata'

export const ProcessTaskParallelBlock: Block = {
  fields: [
    {
      admin: {
        className: 'process-task-parallel-block process-block-row',
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
                        'src/components/graph/fields/graph/flows/parallel/process-task-parallel-field#ProcessTaskParallelField',
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
  imageAltText: 'Two parallel tasks',
  imageURL: '/process-block-shapes/block-parallel.svg',
  interfaceName: 'ProcessTaskParallelBlock',
  labels: I18nCollection.blockLabel.twoParallelTasks,
  slug: 'proc-task-p',
}
