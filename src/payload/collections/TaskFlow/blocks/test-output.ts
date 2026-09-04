import { Block } from 'payload'

import { I18nCollection } from '@/lib/i18n-collection'
import { trimGraphTextFieldHook } from '@/payload/collections/hooks/trim-graph-text-field-hook'
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
                        '@/components/graph/fields/graph/flows/io/process-input-output-field#ProcessInputOutputField',
                    },
                  },
                  hooks: {
                    beforeChange: [trimGraphTextFieldHook],
                  },
                  jsonSchema: connectionSchema,
                  name: 'output',
                  type: 'json',
                },
                {
                  admin: {
                    components: {
                      Field:
                        '@/components/graph/fields/graph/flows/test/process-test-field#ProcessTestField',
                    },
                  },
                  hooks: {
                    beforeChange: [trimGraphTextFieldHook],
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
  labels: I18nCollection.blockLabel.testWithOptionalOutput,
  slug: 'proc-test',
}
