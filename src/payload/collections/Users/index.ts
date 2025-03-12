import { CollectionConfig } from 'payload'
import { I18nCollection } from '@/lib/i18nCollection'
import { collectionAccessAdminAndSelf } from '@/payload/collections/Users/access/collectionAccessAdminAndSelf'
import { anyone } from '@/payload/access/anyone'
import { loginAfterCreate } from '@/payload/collections/Users/hooks/loginAfterCreate'
import { recordSelectedOrganisation } from '@/payload/collections/Users/hooks/recordSelectedOrganisation'
import { superAdminFieldAccess } from '@/payload/access/superAdmins'
import { organisationAdmins } from '@/payload/collections/Users/access/organisationAdmins'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { fieldAccessAdminAndSelf } from '@/payload/collections/Users/access/fieldAccessAdminAndSelf'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    hideAPIURL: true,
    group: I18nCollection.collectionGroup.settings,
    useAsTitle: 'email',
    hidden: (user) => {
      return !user?.user?.roles?.includes(ROLE_SUPER_ADMIN)
    },
  },
  access: {
    read: collectionAccessAdminAndSelf,
    create: anyone,
    update: collectionAccessAdminAndSelf,
    delete: collectionAccessAdminAndSelf,
    // admin: isSuperOrOrganisationAdmin,
  },
  hooks: {
    afterChange: [loginAfterCreate],
    afterLogin: [recordSelectedOrganisation],
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
        create: organisationAdmins,
        update: organisationAdmins,
        // read: organisationAdmins,
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
        read: organisationAdmins,
        update: fieldAccessAdminAndSelf,
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
