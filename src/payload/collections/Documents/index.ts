import { CollectionConfig } from 'payload';
import { I18nCollection } from '@/lib/i18nCollection';
import { isCurrentlySelectedOrganisationAccess } from '@/payload/collections/access/isCurrentlySelectedOrganisationAccess';
import { organisationAdminsAccess } from '@/payload/collections/access/organisationAdminsAccess';
import { adminSettingsField } from '@/payload/fields/admin-settings';
import { assignOrgToUpload } from '@/payload/collections/hooks/assignOrgToUpload';

export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: {
    group: I18nCollection.collectionGroup.files,
  },
  access: {
    read: isCurrentlySelectedOrganisationAccess,
    create: organisationAdminsAccess,
    update: organisationAdminsAccess,
    delete: organisationAdminsAccess,
  },
  hooks: {
    beforeChange: [assignOrgToUpload],
  },
  upload: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
    ],
  },
  fields: [
    {
      name: 'name',
      label: I18nCollection.fieldLabel.name,
      localized: true,
      type: 'text',
    },
    {
      name: 'description',
      label: I18nCollection.fieldLabel.description,
      localized: true,
      type: 'textarea',
    },
    adminSettingsField({ sidebar: true }),
  ],
};
