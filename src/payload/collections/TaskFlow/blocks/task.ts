import { Block } from 'payload';

import './block.scss';
import { tabsMetadata } from '@/payload/collections/TaskFlow/blocks/tabs-metadata';
import { ProcessInputOutputField } from '@/payload/admin-components/graph/fields/processes/process-input-output-field';
import { ProcessTaskField } from '@/payload/admin-components/graph/fields/processes/process-task-field';

export const ProcessTaskInputOutputBlock: Block = {
  slug: 'proc-task-io',
  labels: {
    singular: 'Task with optional input/output',
    plural: 'TaskFlows with optional input/output',
  },
  imageURL: '/process-block-shapes/block-start.svg',
  imageAltText: 'Task with optional input/output',
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
                  name: 'input-output',
                  type: 'json',
                  localized: true,
                  admin: {
                    components: {
                      Field: ProcessInputOutputField,
                    },
                  },
                },
                {
                  name: 'task',
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
