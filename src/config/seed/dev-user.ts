import { Payload } from 'payload'

import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'

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

  // Create a default user if one doesn't exist
  const existingUsers = await payload.find({
    collection: 'users',
  })

  if (existingUsers.docs.length === 0) {
    const musterPark = await payload.create({
      collection: 'organisations',
      data: {
        name: 'Musterpark',
      },
    })
    const testPark = await payload.create({
      collection: 'organisations',
      data: {
        name: 'Testpark',
      },
    })

    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        organisations: [
          {
            organisation: musterPark.id,
            roles: [ROLE_SUPER_ADMIN],
          },
          {
            organisation: testPark.id,
            roles: [ROLE_SUPER_ADMIN],
          },
        ],
        password: 'admin',
        roles: [ROLE_SUPER_ADMIN],
      },
    })

    await payload.create({
      collection: 'users',
      data: {
        email: 'musterpark@parcs-ims.ch',
        firstName: 'Muster',
        lastName: 'Park',
        organisations: [
          {
            organisation: musterPark.id,
            roles: [ROLE_USER],
          },
        ],
        password: 'Test1234',
        roles: [ROLE_USER],
      },
    })

    await payload.create({
      collection: 'users',
      data: {
        email: 'testpark@parcs-ims.ch',
        organisations: [
          {
            organisation: testPark.id,
            roles: [ROLE_USER],
          },
        ],
        password: 'Test1234',
        roles: [ROLE_USER],
      },
    })
  }
}
