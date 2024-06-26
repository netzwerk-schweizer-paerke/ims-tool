import { Block } from 'payload';
import './block.scss';
import { tabsMetadata } from '@/payload/collections/TaskFlow/blocks/tabs-metadata';
import { ProcessTaskField } from '@/payload/admin-components/graph/fields/processes/process-task-field';

export const ProcessTestOutputBlock: Block = {
  slug: 'proc-test',
  labels: {
    singular: 'Test with optional output',
    plural: 'Tests with optional output',
  },
  imageURL: '/process-block-shapes/block-start.svg',
  imageAltText: 'Test with optional output',
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
                  name: 'test',
                  type: 'json',
                  localized: true,
                  admin: {
                    components: {
                      Field: ProcessTaskField,
                    },
                  },
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
