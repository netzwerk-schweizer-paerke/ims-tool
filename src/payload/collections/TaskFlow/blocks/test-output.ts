import { Block } from 'payload'
import { tabsMetadata } from '@/payload/collections/TaskFlow/blocks/tabs-metadata'
import { connectionSchema } from '@/payload/collections/json-schemas/connection-schema'

export const ProcessTestOutputBlock: Block = {
  slug: 'proc-test',
  labels: {
    singular: 'Test with optional output',
    plural: 'Tests with optional output',
  },
  imageURL: '/process-block-shapes/block-test.svg',
  imageAltText: 'Test with optional output',
  interfaceName: 'ProcessTestOutputBlock',
  fields: [
    {
      type: 'row',
      admin: {
        className: 'process-test-block process-block-row',
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
                  name: 'output',
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
                  name: 'test',
                  type: 'json',
                  localized: true,
                  admin: {
                    components: {
                      Field:
                        'src/components/graph/fields/graph/flows/test/process-test-field#ProcessTestField',
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
