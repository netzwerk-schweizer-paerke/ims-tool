import type { FieldAccess } from 'payload';

import { checkUserRoles } from '@/payload/utilities/checkUserRoles';
import { checkOrganisationRoles } from '../utilities/checkOrganisationRoles';
import { User } from '../../../../../payload-types';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants';

export const organisationAdmins: FieldAccess<User> = (args) => {
  const {
    req: { user },
    doc,
  } = args;

  return !!(
    checkUserRoles([ROLE_SUPER_ADMIN], user) ||
    doc?.organisations?.some(({ organisation }) => {
      const id = getIdFromRelation(organisation);
      return checkOrganisationRoles([ROLE_SUPER_ADMIN], user, id);
    })
  );
};
