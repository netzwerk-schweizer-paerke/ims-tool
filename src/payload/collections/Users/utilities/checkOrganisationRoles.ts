import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { User, UserOrganisations } from '@/payload-types'

type NonEmptyArray<T> = T extends (infer U)[] ? (U[] extends [] ? never : T) : never

type NonEmptyUserOrganisations = NonEmptyArray<UserOrganisations>

type Roles = NonEmptyUserOrganisations[0]['roles']

export const checkOrganisationRoles = (
  allRoles: Roles = [],
  user: User | null,
  organisationId: number,
): boolean => {
  if (organisationId) {
    if (
      allRoles.some((role) => {
        return user?.organisations?.some(({ organisation: userOrganisation, roles }) => {
          const organisationID = getIdFromRelation(userOrganisation)
          return organisationID === organisationId && roles?.includes(role)
        })
      })
    )
      return true
  }

  return false
}
