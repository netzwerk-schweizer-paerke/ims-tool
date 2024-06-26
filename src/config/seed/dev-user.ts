import { Payload } from 'payload';
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants';

export const seedDevUser = async (payload: Payload) => {
  // Create a default user if one doesn't exist
  const existingUsers = await payload.find({
    collection: 'users',
    limit: 1,
  });

  if (existingUsers.docs.length === 0) {
    const musterPark = await payload.create({
      collection: 'organisations',
      data: {
        name: 'Musterpark',
      },
    });
    const testPark = await payload.create({
      collection: 'organisations',
      data: {
        name: 'Testpark',
      },
    });

    await payload.create({
      collection: 'users',
      data: {
        roles: [ROLE_SUPER_ADMIN],
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'admin',
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
      },
    });

    await payload.create({
      collection: 'users',
      data: {
        roles: [ROLE_USER],
        firstName: 'Muster',
        lastName: 'Park',
        email: 'musterpark@parcs-ims.ch',
        password: 'Test1234',
        organisations: [
          {
            organisation: musterPark.id,
            roles: [ROLE_USER],
          },
        ],
      },
    });

    await payload.create({
      collection: 'users',
      data: {
        roles: [ROLE_USER],
        email: 'testpark@parcs-ims.ch',
        password: 'Test1234',
        organisations: [
          {
            organisation: testPark.id,
            roles: [ROLE_USER],
          },
        ],
      },
    });
  }
};
