import { Payload } from 'payload'

import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'

/**
 * Creates the local development super admin. The caller must run this only outside
 * production, because the password is published in this file.
 */
export const seedDevUser = async (payload: Payload) => {
  // Create admin user on imported dbs
  const devAdminUser = await payload.find({
    collection: 'users',
    where: {
      email: { equals: 'admin@test.com' },
    },
  })
  if (devAdminUser.docs.length === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'admin',
        roles: [ROLE_SUPER_ADMIN],
      },
    })
  }
}
