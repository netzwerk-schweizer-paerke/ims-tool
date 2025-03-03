import { CollectionConfig } from 'payload'
import { I18nCollection } from '@/lib/i18nCollection'
import { isCurrentlySelectedOrganisationAccess } from '@/payload/collections/access/isCurrentlySelectedOrganisationAccess'
import { loggedInAccess } from '@/payload/collections/access/loggedInAccess'
import { organisationAdminsAccess } from '@/payload/collections/access/organisationAdminsAccess'
import { adminSettingsField } from '@/payload/fields/admin-settings'
import { assignOrgToUpload } from '@/payload/collections/hooks/assignOrgToUpload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    hideAPIURL: true,
    group: I18nCollection.collectionGroup.files,
    hidden: true,
  },
  access: {
    read: isCurrentlySelectedOrganisationAccess,
    create: loggedInAccess,
    update: organisationAdminsAccess,
    delete: organisationAdminsAccess,
  },
  hooks: {
    beforeChange: [assignOrgToUpload],
  },
  upload: {
    imageSizes: [
      {
        name: 'thumbnail',
        width: 200,
        height: 200,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        position: 'centre',
      },
    ],
    mimeTypes: ['image/*'],
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
