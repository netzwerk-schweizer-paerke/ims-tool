import { Block } from 'payload';
import './block.scss';
import { tabsMetadata } from '@/payload/collections/TaskFlow/blocks/tabs-metadata';
import { connectionSchema } from '@/payload/collections/json-schemas/connection-schema';
import { ProcessInputOutputField } from '@/admin-components/graph/fields/graph/flows/io/process-input-output-field';
import { ProcessTestField } from '@/admin-components/graph/fields/graph/flows/test/process-test-field';

export const ProcessTestOutputBlock: Block = {
  slug: 'proc-test',
  labels: {
    singular: 'Test with optional output',
    plural: 'Tests with optional output',
  },
  imageURL: '/process-block-shapes/block-start.svg',
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
                  localized: true,
                  admin: {
                    components: {
                      Field: ProcessInputOutputField,
                    },
                  },
                  jsonSchema: connectionSchema,
                },
                {
                  name: 'test',
                  type: 'json',
                  localized: true,
                  admin: {
                    components: {
                      Field: ProcessTestField,
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
};
