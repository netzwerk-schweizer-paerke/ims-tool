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

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true,
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
    // admin: isSuperOrOrganisationAdmin,
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
