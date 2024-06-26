import { Access } from 'payload';
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants';

export const isAdminOrOwnUser: Access = ({ req: { user } }) => {
  if (user && user.role === ROLE_SUPER_ADMIN) {
    return true;
  }

  if (user) {
    return {
      id: {
        equals: user.id,
      },
    };
  }

  return false;
};
