import { CollectionConfig } from 'payload'
import { I18nCollection } from '@/lib/i18n-collection'
import { adminSettingsField } from '@/payload/fields/admin-settings'
import { assignOrgToUploadBeforeChangeHook } from '@/payload/collections/hooks/assign-org-to-upload-before-change-hook'
import { mimeTypes } from '@/config/file-upload-mime'
import { currentOrganisationCollectionReadAccess } from '@/payload/collections/access/current-organisation-collection-read-access'
import { currentOrganisationCollectionWriteAccess } from '@/payload/collections/access/current-organisation-collection-write-access'

const isLocalHost = (hostName: string) => {
  const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0']
  // Extract hostname without port if port is present
  const hostname = hostName.split(':')[0]
  return localhostPatterns.includes(hostname)
}

export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: {
    hideAPIURL: true,
    group: I18nCollection.collectionGroup.files,
  },
  access: {
    read: async (args) => {
      const hasCollectionAccess = await currentOrganisationCollectionReadAccess(args)
      const {
        req: { headers, host },
      } = args
      const internalAccess = headers.has('X-Payload-Request') && isLocalHost(host)
      if (internalAccess) {
        return true
      } else {
        return hasCollectionAccess
      }
    },
    create: currentOrganisationCollectionWriteAccess,
    update: currentOrganisationCollectionWriteAccess,
    delete: currentOrganisationCollectionWriteAccess,
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
    {
      name: 'itemType',
      type: 'text',
      virtual: true,
      defaultValue: 'documents',
    },
    adminSettingsField({ sidebar: true }),
  ],
}
