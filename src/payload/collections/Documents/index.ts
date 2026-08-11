import { CollectionConfig } from 'payload'

import { mimeTypes } from '@/config/file-upload-mime'
import { isProduction } from '@/lib/environment'
import { I18nCollection } from '@/lib/i18n-collection'
import { currentOrganisationCollectionReadAccess } from '@/payload/collections/access/current-organisation-collection-read-access'
import { currentOrganisationCollectionWriteAccess } from '@/payload/collections/access/current-organisation-collection-write-access'
import { assignOrgToUploadBeforeChangeHook } from '@/payload/collections/hooks/assign-org-to-upload-before-change-hook'
import { adminSettingsField } from '@/payload/fields/admin-settings'

import { addUsageInfoAfterReadHook } from './hooks/add-usage-info'

const isLocalHost = (hostName: string) => {
  const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0']
  // Extract hostname without port if port is present
  const hostname = hostName.split(':', 1)[0]
  return localhostPatterns.includes(hostname)
}

export const Documents: CollectionConfig = {
  access: {
    create: currentOrganisationCollectionWriteAccess,
    delete: currentOrganisationCollectionWriteAccess,
    read: currentOrganisationCollectionReadAccess,
    update: currentOrganisationCollectionWriteAccess,
  },
  admin: {
    group: I18nCollection.collectionGroup.files,
    hideAPIURL: isProduction,
  },
  fields: [
    {
      label: I18nCollection.fieldLabel.name,
      localized: true,
      name: 'name',
      type: 'text',
    },
    {
      label: I18nCollection.fieldLabel.description,
      localized: true,
      name: 'description',
      type: 'textarea',
    },
    {
      defaultValue: 'documents',
      name: 'itemType',
      type: 'text',
      virtual: true,
    },
    adminSettingsField({ sidebar: true }),
    // Virtual fields to display usage information
    {
      admin: {
        description: 'Number of places this document is used',
        position: 'sidebar',
        readOnly: true,
      },
      name: 'usageCount',
      type: 'number',
      virtual: true,
    },
    {
      admin: {
        description: 'Where this document is referenced',
        position: 'sidebar',
        readOnly: true,
      },
      name: 'usedIn',
      type: 'json',
      virtual: true,
    },
  ],
  hooks: {
    afterRead: [addUsageInfoAfterReadHook],
    beforeChange: [assignOrgToUploadBeforeChangeHook],
  },
  slug: 'documents',
  upload: {
    mimeTypes, // Use the configured MIME types for validation
  },
}
