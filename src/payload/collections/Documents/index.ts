import { CollectionConfig } from 'payload'
import { I18nCollection } from '@/lib/i18nCollection'
import { currentOrganisationCollectionAccess } from '@/payload/collections/access/current-organisation-collection-access'
import { organisationAdminsCollectionAccess } from '@/payload/collections/access/organisation-admin-collection-access'
import { adminSettingsField } from '@/payload/fields/admin-settings'
import { assignOrgToUploadBeforeChangeHook } from '@/payload/collections/hooks/assign-org-to-upload-before-change-hook'
import { mimeTypes } from '@/config/file-upload-mime'

export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: {
    hideAPIURL: true,
    group: I18nCollection.collectionGroup.files,
  },
  access: {
    read: currentOrganisationCollectionAccess,
    create: organisationAdminsCollectionAccess,
    update: organisationAdminsCollectionAccess,
    delete: organisationAdminsCollectionAccess,
  },
  hooks: {
    beforeChange: [assignOrgToUploadBeforeChangeHook],
  },
  upload: {
    mimeTypes,
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
}
