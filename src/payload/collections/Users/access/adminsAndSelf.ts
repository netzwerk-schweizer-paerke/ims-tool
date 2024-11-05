import type { Access, AccessResult } from 'payload';

import { isAdmin } from '@/payload/utilities/isAdmin';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';

export const adminsAndSelf: Access = async ({ req: { user, payload } }): Promise<AccessResult> => {
  if (!user) return false;
  const isSuperAdmin = isAdmin(user);
  if (isSuperAdmin) {
    payload.logger.warn(`🔒adminsAndSelf: ${isSuperAdmin}`, { user: user?.id });
    return true;
  }

  if (!isSuperAdmin) {
    return {
      id: {
        equals: user.id,
      },
    };
  }

  // allow users to read themselves and any users within the isCurrentlySelectedOrganisationAccess they are admins of
  return {
    or: [
      {
        id: {
          equals: user.id,
        },
      },
      {
        'organisations.organisation': {
          in: [getIdFromRelation(user.selectedOrganisation)].filter(
            (id): id is string | number => id !== null,
          ),
        },
      },
      // : user?.organisations
      //     ?.map(({ organisation, roles }) =>
      //       roles.includes(ROLE_SUPER_ADMIN) ? getIdFromRelation(organisation) : null,
      //     )
      //     .filter((id): id is string | number => id !== null)
      //     .map((id) => ({
      //       'organisations.organisation': {
      //         in: [id],
      //       },
      //     })) || []),
    ],
  };
};
