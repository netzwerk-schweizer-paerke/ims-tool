import { User, UserOrganisations } from '../../../../../payload-types';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';

type NonEmptyArray<T> = T extends (infer U)[] ? (U[] extends [] ? never : T) : never;

type NonEmptyUserOrganisations = NonEmptyArray<UserOrganisations>;

type Roles = NonEmptyUserOrganisations[0]['roles'];
type Organisation = NonEmptyUserOrganisations[0];

export const checkOrganisationRoles = (
  allRoles: Roles = [],
  user: User | null,
  organisation: Organisation | null | undefined,
): boolean => {
  if (organisation) {
    const id = getIdFromRelation(organisation);

    if (
      allRoles.some((role) => {
        return user?.organisations?.some(({ organisation: userOrganisation, roles }) => {
          const organisationID = getIdFromRelation(userOrganisation);
          return organisationID === id && roles?.includes(role);
        });
      })
    )
      return true;
  }

  return false;
};
