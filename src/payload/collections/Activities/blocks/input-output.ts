import { Block } from 'payload';
import { tabsMetadata } from '@/payload/collections/Activities/blocks/tabs-metadata';
import { connectionSchema } from '@/payload/collections/json-schemas/connection-schema';

export const ActivityIOBlock: Block = {
  slug: 'activity-io',
  labels: {
    singular: 'Input/output task group',
    plural: 'Input/output task groups',
  },
  imageURL: '/process-block-shapes/input-output.svg',
  imageAltText: 'Input/output task group',
  interfaceName: 'ActivityIOBlock',
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
                  Field:
                    'src/admin-components/graph/fields/graph/activities/io/activity-i-o-field#ActivityIOField',
                },
              },
              jsonSchema: connectionSchema,
            },
          ],
        },
        ...tabsMetadata,
      ],
    },
  ],
};
