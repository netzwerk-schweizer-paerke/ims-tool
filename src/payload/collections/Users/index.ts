import { CollectionConfig } from 'payload'

import { renderPasswordResetEmail } from '@/lib/email-renderer'
import { isProduction } from '@/lib/environment'
import { I18nCollection } from '@/lib/i18n-collection'
import { getLocaleCodes } from '@/lib/locale-utils'
import { anyone } from '@/payload/access/anyone'
import { superAdminFieldAccess } from '@/payload/access/super-admins-collection-access'
import { adminAndSelfCollectionAccess } from '@/payload/collections/Users/access/admin-and-self-collection-access'
import { adminAndSelfFieldAccess } from '@/payload/collections/Users/access/admin-and-self-field-access'
import { loginAfterCreateUserAfterChangeHook } from '@/payload/collections/Users/hooks/login-after-create-user-after-change-hook'
import { recordSelectedOrganisationAfterLoginHook } from '@/payload/collections/Users/hooks/record-selected-organisation-after-login-hook'
import { organisationAdminFieldAccess } from '@/payload/fields/access/organisation-admin-field-access'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'

export const Users: CollectionConfig = {
  access: {
    create: anyone,
    delete: adminAndSelfCollectionAccess,
    read: adminAndSelfCollectionAccess,
    update: adminAndSelfCollectionAccess,
  },
  admin: {
    group: I18nCollection.collectionGroup.settings,
    hidden: (user) => {
      return !user?.user?.roles?.includes(ROLE_SUPER_ADMIN)
    },
    hideAPIURL: isProduction,
    useAsTitle: 'email',
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: async (args) => {
        if (!args) {
          throw new Error('Missing required fields')
        }
        const { req, token, user } = args

        // Validate required parameters
        if (!user?.email || !token) {
          throw new Error('Missing required user email or token')
        }

        const systemLocales = req?.payload.config ? getLocaleCodes(req?.payload.config) : false
        const defaultLocale = 'en'

        // Determine user's preferred locale (fallback to 'en')
        const acceptLanguage = req?.headers?.get?.('accept-language') || ''
        const locale = acceptLanguage.split(',', 1)[0]?.split('-', 1)[0]
        const supportedLocales = systemLocales || [defaultLocale]
        const userLocale = supportedLocales.includes(locale) ? locale : defaultLocale

        // Generate the HTML using React Email
        const emailHtml = await renderPasswordResetEmail({
          locale: userLocale as any,
          token,
          userEmail: user.email,
        })

        req?.payload.logger.info({
          action: 'password_reset_email_generated',
          locale: userLocale,
          tokenLength: token.length,
          userEmail: user.email,
        })

        return emailHtml
      },
    },
    useAPIKey: true,
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
    },
    {
      name: 'lastName',
      type: 'text',
    },
    {
      name: 'email',
      required: true,
      type: 'text',
      unique: true,
    },
    {
      access: {
        create: superAdminFieldAccess,
        update: superAdminFieldAccess,
        // read: superAdminFieldAccess,
        // delete: superAdminFieldAccess,
      },
      hasMany: true,
      name: 'roles',
      options: [
        {
          label: 'Admin',
          value: ROLE_SUPER_ADMIN,
        },
        {
          label: 'User',
          value: ROLE_USER,
        },
      ],
      required: true,
      type: 'select',
    },
    {
      access: {
        create: organisationAdminFieldAccess,
        update: organisationAdminFieldAccess,
        // read: organisationAdminFieldAccess,
      },
      fields: [
        {
          name: 'organisation',
          relationTo: 'organisations',
          required: true,
          type: 'relationship',
        },
        {
          hasMany: true,
          name: 'roles',
          options: [
            {
              label: 'Admin',
              value: ROLE_SUPER_ADMIN,
            },
            {
              label: 'Users',
              value: ROLE_USER,
            },
          ],
          required: true,
          type: 'select',
        },
      ],
      interfaceName: 'UserOrganisations',
      label: 'Organisations',
      name: 'organisations',
      type: 'array',
    },
    {
      access: {
        create: () => false,
        read: organisationAdminFieldAccess,
        update: adminAndSelfFieldAccess,
      },
      admin: {
        position: 'sidebar',
      },
      index: true,
      name: 'selectedOrganisation',
      relationTo: 'organisations',
      type: 'relationship',
    },
  ],
  hooks: {
    afterChange: [loginAfterCreateUserAfterChangeHook],
    afterLogin: [recordSelectedOrganisationAfterLoginHook],
  },
  slug: 'users',
}
