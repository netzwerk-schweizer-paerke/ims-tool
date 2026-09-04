import { CollectionConfig } from 'payload'

import { isProduction } from '@/lib/environment'
import { I18nCollection } from '@/lib/i18n-collection'
import { authenticatedCollectionAccess } from '@/payload/collections/access/authenticated-collection-access'
import {
  isShareLinkAdmin,
  shareLinkAdminAccess,
  shareLinkOwnerOrAdminAccess,
} from '@/payload/collections/ShareLinks/access/share-link-access'
import { stampShareLinkHook } from '@/payload/collections/ShareLinks/hooks/stamp-share-link-hook'

/**
 * A share link opens without a session, so the client never writes these three fields. Payload
 * strips a denied field before the hook runs, and `stampShareLinkHook` then sets the real value.
 */
const serverOnlyField = () => false

export const ShareLinks: CollectionConfig = {
  access: {
    // The hook resolves the target with the caller's own read access, so a create cannot reach
    // a page the caller may not see.
    create: authenticatedCollectionAccess,
    delete: shareLinkOwnerOrAdminAccess,
    read: shareLinkOwnerOrAdminAccess,
    update: shareLinkAdminAccess,
  },
  admin: {
    defaultColumns: ['token', 'targetType', 'createdBy', 'organisation', 'createdAt'],
    group: I18nCollection.collectionGroup.settings,
    hidden: ({ user }) => !isShareLinkAdmin(user),
    hideAPIURL: isProduction,
    useAsTitle: 'token',
  },
  fields: [
    {
      access: { create: serverOnlyField, update: serverOnlyField },
      admin: { readOnly: true },
      label: I18nCollection.fieldLabel.token,
      name: 'token',
      required: true,
      type: 'text',
      unique: true,
    },
    {
      access: { create: serverOnlyField, update: serverOnlyField },
      admin: { readOnly: true },
      label: I18nCollection.fieldLabel.createdBy,
      name: 'createdBy',
      relationTo: 'users',
      required: true,
      type: 'relationship',
    },
    {
      access: { create: serverOnlyField, update: serverOnlyField },
      admin: { readOnly: true },
      index: true,
      label: I18nCollection.fieldLabel.organisation,
      name: 'organisation',
      relationTo: 'organisations',
      required: true,
      type: 'relationship',
    },
    {
      label: I18nCollection.fieldLabel.targetType,
      name: 'targetType',
      options: [
        { label: I18nCollection.shareLinkTarget.activityBlock, value: 'activityBlock' },
        { label: I18nCollection.shareLinkTarget.activityLandscape, value: 'activityLandscape' },
        { label: I18nCollection.shareLinkTarget.flow, value: 'flow' },
        { label: I18nCollection.shareLinkTarget.list, value: 'list' },
      ],
      required: true,
      type: 'select',
    },
    {
      label: I18nCollection.fieldLabel.activity,
      name: 'activity',
      relationTo: 'activities',
      type: 'relationship',
    },
    {
      // A block id belongs to one locale, so it is stored as written and resolved by position on
      // read. See the pitfall page `block-id-is-per-locale`.
      label: I18nCollection.fieldLabel.blockId,
      name: 'blockId',
      type: 'text',
    },
    {
      label: I18nCollection.fieldLabel.taskFlow,
      name: 'taskFlow',
      relationTo: 'task-flows',
      type: 'relationship',
    },
    {
      label: I18nCollection.fieldLabel.taskList,
      name: 'taskList',
      relationTo: 'task-lists',
      type: 'relationship',
    },
    {
      label: I18nCollection.fieldLabel.locale,
      name: 'locale',
      type: 'text',
    },
  ],
  hooks: {
    beforeChange: [stampShareLinkHook],
  },
  labels: I18nCollection.collectionLabel.shareLinks,
  slug: 'share-links',
}
