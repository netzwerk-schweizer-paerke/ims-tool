import { CollectionConfig } from 'payload'
import { I18nCollection } from '@/lib/i18n-collection'
import { isProduction } from '@/lib/environment'
import { anyone } from '@/payload/access/anyone'
import { loginAfterCreateUserAfterChangeHook } from '@/payload/collections/Users/hooks/login-after-create-user-after-change-hook'
import { recordSelectedOrganisationAfterLoginHook } from '@/payload/collections/Users/hooks/record-selected-organisation-after-login-hook'
import { superAdminFieldAccess } from '@/payload/access/super-admins-collection-access'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { adminAndSelfCollectionAccess } from '@/payload/collections/Users/access/admin-and-self-collection-access'
import { organisationAdminFieldAccess } from '@/payload/fields/access/organisation-admin-field-access'
import { adminAndSelfFieldAccess } from '@/payload/collections/Users/access/admin-and-self-field-access'
import { renderPasswordResetEmail } from '@/lib/email-renderer'
import { getLocaleCodes } from '@/lib/locale-utils'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true,
    forgotPassword: {
      generateEmailHTML: async (args) => {
        if (!args) {
          throw new Error('Missing required fields')
        }
        const { user, req, token } = args

        // Validate required parameters
        if (!user?.email || !token) {
          throw new Error('Missing required user email or token')
        }

        const systemLocales = req?.payload.config ? getLocaleCodes(req?.payload.config) : false
        const defaultLocale = 'en'

        // Determine user's preferred locale (fallback to 'en')
        const acceptLanguage = req?.headers?.get?.('accept-language') || ''
        const locale = acceptLanguage.split(',')[0]?.split('-')[0]
        const supportedLocales = systemLocales || [defaultLocale]
        const userLocale = supportedLocales.includes(locale) ? locale : defaultLocale

        // Generate the HTML using React Email
        const emailHtml = await renderPasswordResetEmail({
          userEmail: user.email,
          token,
          locale: userLocale as any,
        })

        req?.payload.logger.info({
          action: 'password_reset_email_generated',
          userEmail: user.email,
          locale: userLocale,
          tokenLength: token.length,
        })

        return emailHtml
      },
    },
  },
  admin: {
    hideAPIURL: isProduction,
    group: I18nCollection.collectionGroup.settings,
    useAsTitle: 'email',
    hidden: (user) => {
      return !user?.user?.roles?.includes(ROLE_SUPER_ADMIN)
    },
  },
  access: {
    read: adminAndSelfCollectionAccess,
    create: anyone,
    update: adminAndSelfCollectionAccess,
    delete: adminAndSelfCollectionAccess,
  },
  hooks: {
    afterChange: [loginAfterCreateUserAfterChangeHook],
    afterLogin: [recordSelectedOrganisationAfterLoginHook],
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
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      access: {
        create: superAdminFieldAccess,
        update: superAdminFieldAccess,
        // read: superAdminFieldAccess,
        // delete: superAdminFieldAccess,
      },
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
    },
    {
      name: 'organisations',
      type: 'array',
      label: 'Organisations',
      interfaceName: 'UserOrganisations',
      access: {
        create: organisationAdminFieldAccess,
        update: organisationAdminFieldAccess,
        // read: organisationAdminFieldAccess,
      },
      fields: [
        {
          name: 'organisation',
          type: 'relationship',
          relationTo: 'organisations',
          required: true,
        },
        {
          name: 'roles',
          type: 'select',
          hasMany: true,
          required: true,
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
        },
      ],
    },
    {
      name: 'selectedOrganisation',
      type: 'relationship',
      relationTo: 'organisations',
      index: true,
      access: {
        create: () => false,
        read: organisationAdminFieldAccess,
        update: adminAndSelfFieldAccess,
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
