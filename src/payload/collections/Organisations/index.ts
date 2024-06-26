import { CollectionConfig } from 'payload';
import { translations } from '@/lib/translations';
import { superAdmins } from '@/payload/access/superAdmins';
import { organisationAdmins } from '@/payload/collections/Organisations/access/organisationAdmins';
import { createdByField } from '@/payload/fields/created-by';
import { updatedByField } from '@/payload/fields/updated-by';

export const Organisations: CollectionConfig = {
  slug: 'organisations',
  labels: {
    plural: translations.fieldLabel.organisations,
    singular: translations.fieldLabel.organisation,
  },
  admin: {
    group: translations.collectionGroup.settings,
    useAsTitle: 'name',
  },
  access: {
    create: superAdmins,
    read: organisationAdmins,
    update: organisationAdmins,
    delete: superAdmins,
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
      type: 'textarea',
    },
    createdByField,
    updatedByField,
  ],
};
