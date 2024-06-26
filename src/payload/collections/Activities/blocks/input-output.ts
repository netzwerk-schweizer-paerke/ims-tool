import { Block } from 'payload';

import './block.scss';
import { tabsMetadata } from '@/payload/collections/Activities/blocks/tabs-metadata';
import { ActivityIOField } from '@/payload/admin-components/graph/fields/activities/activity-i-o-field';

export const ActivityIOBlock: Block = {
  slug: 'activity-io',
  labels: {
    singular: 'Input/output task group',
    plural: 'Input/output task groups',
  },
  imageURL: '/process-block-shapes/input-output.svg',
  imageAltText: 'Input/output task group',
  fields: [
    {
      type: 'row',
      admin: {
        className: 'activity-io-block task-group-row',
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
              name: 'task',
              type: 'json',
              localized: true,
              admin: {
                components: {
                  Field: ActivityIOField,
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
