import { Payload } from 'payload';

export const seedDevUser = async (payload: Payload) => {
  // Create a default user if one doesn't exist
  const existingUsers = await payload.find({
    collection: 'users',
    limit: 1,
  });

  if (existingUsers.docs.length === 0) {
    await payload.create({
      collection: 'users',
      data: {
        role: 'admin',
        email: 'admin@test.com',
        password: 'admin',
      },
    });
  }
};
