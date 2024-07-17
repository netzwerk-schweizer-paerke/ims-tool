import { Block } from 'payload';

import './block.scss';
import { tabsMetadata } from '@/payload/collections/TaskFlow/blocks/tabs-metadata';
import { connectionSchema } from '@/payload/collections/json-schemas/connection-schema';
import { ProcessTaskParallelField } from '@/admin-components/graph/fields/graph/flows/parallel/process-task-parallel-field';

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
                  localized: true,
                  admin: {
                    components: {
                      Field: ProcessTaskParallelField,
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
