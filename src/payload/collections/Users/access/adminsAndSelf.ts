import type { Access } from 'payload';

import { isAdmin } from '@/payload/utilities/isAdmin';
import { User } from '../../../../../payload-types';
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants';

export const adminsAndSelf: Access<User> = async ({ req: { user } }) => {
  if (!user) return false;
  const isSuper = isAdmin(user);

  // allow super-admins through only if they have not scoped their user via `selectedOrganisation`
  if (isSuper && !user?.selectedOrganisation) {
    return true;
  }

  // allow users to read themselves and any users within the organisationsAccess they are admins of
  return {
    or: [
      {
        id: {
          equals: user.id,
        },
      },
      ...(isSuper
        ? [
            {
              'organisations.organisation': {
                in: [
                  typeof user?.selectedOrganisation === 'string'
                    ? user?.selectedOrganisation
                    : user?.selectedOrganisation?.id,
                ].filter(Boolean),
              },
            },
          ]
        : [
            {
              'organisations.organisation': {
                in:
                  user?.organisations
                    ?.map(({ organisation, roles }) =>
                      roles.includes(ROLE_SUPER_ADMIN)
                        ? typeof organisation === 'string'
                          ? organisation
                          : organisation.id
                        : null,
                    ) // eslint-disable-line function-paren-newline
                    .filter(Boolean) || [],
              },
            },
          ]),
    ],
  };
};
