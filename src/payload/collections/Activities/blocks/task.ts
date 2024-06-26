import { Block } from 'payload';

import './block.scss';
import { ActivityTaskField } from '@/payload/admin-components/graph/fields/activities/activity-task-field';
import { tabsMetadata } from '@/payload/collections/Activities/blocks/tabs-metadata';

export const ActivityTaskBlock: Block = {
  slug: 'activity-task',
  labels: {
    singular: 'Task group',
    plural: 'Task groups',
  },
  imageURL: '/process-block-shapes/task.svg',
  imageAltText: 'Task group',
  fields: [
    {
      type: 'row',
      admin: {
        className: 'task-group-io-block task-group-row',
      },
      fields: [
        {
          type: 'group',
          name: 'graph',
          label: false,
          localized: true,
          admin: {
            className: 'graph-fields-group',
          },
          fields: [
            {
              name: 'task',
              type: 'json',
              localized: true,
              admin: {
                components: {
                  Field: ActivityTaskField,
                },
              },
            },
          ],
        },
        ...tabsMetadata,
      ],
    },
  ],
};
