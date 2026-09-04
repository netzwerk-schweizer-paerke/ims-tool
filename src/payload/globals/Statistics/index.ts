import { GlobalConfig } from 'payload'

import { I18nCollection } from '@/lib/i18n-collection'
import { superAdminsCollectionAccess } from '@/payload/access/super-admins-collection-access'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'

/**
 * A nav entry and a route, nothing else.
 *
 * Payload builds each sidebar group from the collections and the globals alone
 * (`@payloadcms/ui/dist/utilities/groupNavItems.js`), so an entry inside the existing
 * `Settings` group has to be one of the two. This global stores no data, and
 * `admin.components.views.edit.root` replaces its whole document view with the dashboard.
 *
 * `admin.hidden` on a global takes `{ user }`. A collection takes the page result instead,
 * and the wrong shape still compiles.
 */
export const Statistics: GlobalConfig = {
  access: {
    read: superAdminsCollectionAccess,
    // Nothing writes to this global. A denied update also removes the Save button.
    update: () => false,
  },
  admin: {
    components: {
      views: {
        edit: {
          root: {
            Component: '@/components/views/statistics#StatisticsView',
          },
        },
      },
    },
    group: I18nCollection.collectionGroup.settings,
    hidden: ({ user }) => !user?.roles?.includes(ROLE_SUPER_ADMIN),
  },
  fields: [],
  label: I18nCollection.globalLabel.statistics,
  slug: 'statistics',
}
