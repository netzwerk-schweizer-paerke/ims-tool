import { Block } from 'payload'

import { connectionSchema } from '@/payload/collections/json-schemas/connection-schema'
import { tabsMetadata } from '@/payload/collections/TaskFlow/blocks/tabs-metadata'

export const ProcessTestOutputBlock: Block = {
  fields: [
    {
      admin: {
        className: 'process-test-block process-block-row',
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
                        'src/components/graph/fields/graph/flows/io/process-input-output-field#ProcessInputOutputField',
                    },
                  },
                  jsonSchema: connectionSchema,
                  name: 'output',
                  type: 'json',
                },
                {
                  admin: {
                    components: {
                      Field:
                        'src/components/graph/fields/graph/flows/test/process-test-field#ProcessTestField',
                    },
                  },
                  jsonSchema: connectionSchema,
                  localized: true,
                  name: 'test',
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
  imageAltText: 'Test with optional output',
  imageURL: '/process-block-shapes/block-test.svg',
  interfaceName: 'ProcessTestOutputBlock',
  labels: {
    plural: 'Tests with optional output',
    singular: 'Test with optional output',
  },
  slug: 'proc-test',
}
