import { CollectionConfig } from 'payload'
import { I18nCollection } from '@/lib/i18n-collection'
import { isProduction } from '@/lib/environment'
import { adminSettingsField } from '@/payload/fields/admin-settings'
import { assignOrgToUploadBeforeChangeHook } from '@/payload/collections/hooks/assign-org-to-upload-before-change-hook'
import { mimeTypes } from '@/config/file-upload-mime'
import { currentOrganisationCollectionReadAccess } from '@/payload/collections/access/current-organisation-collection-read-access'
import { currentOrganisationCollectionWriteAccess } from '@/payload/collections/access/current-organisation-collection-write-access'
import { addUsageInfoAfterReadHook } from './hooks/add-usage-info'

const isLocalHost = (hostName: string) => {
  const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0']
  // Extract hostname without port if port is present
  const hostname = hostName.split(':')[0]
  return localhostPatterns.includes(hostname)
}

export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: {
    hideAPIURL: isProduction,
    group: I18nCollection.collectionGroup.files,
  },
  access: {
    read: currentOrganisationCollectionReadAccess,
    create: currentOrganisationCollectionWriteAccess,
    update: currentOrganisationCollectionWriteAccess,
    delete: currentOrganisationCollectionWriteAccess,
  },
  hooks: {
    beforeChange: [assignOrgToUploadBeforeChangeHook],
    afterRead: [addUsageInfoAfterReadHook],
  },
  upload: {
    mimeTypes, // Use the configured MIME types for validation
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
    {
      name: 'itemType',
      type: 'text',
      virtual: true,
      defaultValue: 'documents',
    },
    adminSettingsField({ sidebar: true }),
    // Virtual fields to display usage information
    {
      name: 'usageCount',
      type: 'number',
      virtual: true,
      admin: {
        position: 'sidebar',
        description: 'Number of places this document is used',
        readOnly: true,
      },
    },
    {
      name: 'usedIn',
      type: 'json',
      virtual: true,
      admin: {
        position: 'sidebar',
        description: 'Where this document is referenced',
        readOnly: true,
      },
    },
  ],
}
