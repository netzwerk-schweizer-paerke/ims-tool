import { CollectionConfig } from 'payload/types';
import { translations } from '@/lib/translations';
import { StartBlock } from '@/payload/collections/process-blocks/start';

export const Processes: CollectionConfig = {
  slug: 'processes',
  admin: {
    group: translations.collectionGroup.process,
    useAsTitle: 'name',
  },
  labels: {
    plural: translations.fieldLabel.processes,
    singular: translations.fieldLabel.process,
  },
  fields: [
    {
      name: 'name',
      label: translations.fieldLabel.name,
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: translations.fieldLabel.description,
      type: 'richText',
    },
    {
      name: 'fragment',
      label: translations.fieldLabel.fragment,
      type: 'blocks',
      blocks: [StartBlock],
    },
  ],
};
