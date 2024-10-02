import { checkUserRoles } from '@/payload/utilities/checkUserRoles';
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';
import { Access } from 'payload';
import { User } from '@/types/payload-types';

// the user must be an admin of the document's organisation
export const organisationAdminsAccess: Access<User> = ({ req: { user } }) => {
  // Users with admin role always have superuser access
  if (checkUserRoles([ROLE_SUPER_ADMIN], user)) {
    return true;
  }

  // Regular users need to be associated with the currently selected organisation and be defined as an admin
  const userOrgsAndRoles = user?.organisations?.map(({ organisation, roles }) => {
    return {
      id: getIdFromRelation(organisation),
      roles: roles || [],
    };
  });

  const selectedOrgId = getIdFromRelation(user?.selectedOrganisation);

  return !!userOrgsAndRoles?.some(
    ({ id, roles }) => id === selectedOrgId && roles.includes(ROLE_SUPER_ADMIN),
  );
};
