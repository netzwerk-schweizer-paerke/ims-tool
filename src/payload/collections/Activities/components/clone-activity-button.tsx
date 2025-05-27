import { DrawerToggler } from '@payloadcms/ui'
import { CloneActivitiesOverlay } from '@/payload/collections/Activities/components/clone-activities-overlay'
import { User } from '@/payload-types'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { Payload } from 'payload'
import { compact, toNumber } from 'lodash-es'
import { isOrganisation } from '@/payload/assertions'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'

export const baseClass = 'clone-activity-button'
export const drawerSlug = 'clone-activities'

type Props = {
  user: User
  payload: Payload
}
export const CloneActivityButton: React.FC<Props> = async ({ user, payload }) => {
  if (!user) return null

  const selectedOrgId = toNumber(getIdFromRelation(user.selectedOrganisation))

  const organisations = await payload.find({
    collection: 'organisations',
    limit: 0,
    depth: 0,
  })

  const activities = await payload.find({
    collection: 'activities',
    where: {
      organisation: {
        equals: selectedOrgId,
      },
    },
    depth: 0,
  })

  if (!selectedOrgId) {
    payload.logger.warn({
      msg: `CloneActivityButton: No selected organisation found for user ${user.id}`,
    })
    return null
  }

  if (
    !checkOrganisationRoles([ROLE_USER, ROLE_SUPER_ADMIN], user, selectedOrgId) &&
    !checkUserRoles([ROLE_USER, ROLE_SUPER_ADMIN], user)
  ) {
    payload.logger.warn({
      msg: `CloneActivityButton: User ${user.id} does not have admin role in selected org or is not super admin`,
    })
    return null
  }

  const userOrganisations = compact(
    organisations.docs
      .filter((org) =>
        user.organisations?.some((userOrg) => getIdFromRelation(userOrg.organisation) === org.id),
      )
      .map((org) => {
        if (checkOrganisationRoles([ROLE_SUPER_ADMIN], user, getIdFromRelation(org))) {
          return org
        }
        return null
      }),
  )

  const targetOrganisations = compact(
    userOrganisations.map((org) => {
      if (isOrganisation(org)) {
        return {
          label: org.name,
          value: toNumber(getIdFromRelation(org)),
        }
      }
    }),
  )

  if (!activities) return null
  if (activities.totalDocs === 0) return null

  return (
    <>
      <div className={'flex flex-row gap-6'}>
        <DrawerToggler
          className={`${baseClass}__edit btn btn--size-small btn--style-secondary`}
          slug={drawerSlug}>
          Clone activities
        </DrawerToggler>
      </div>
      <CloneActivitiesOverlay
        activities={activities.docs}
        targetOrganisations={targetOrganisations}
      />
    </>
  )
}
