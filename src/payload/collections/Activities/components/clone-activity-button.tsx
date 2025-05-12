import React from 'react'
import { DrawerToggler } from '@payloadcms/ui'
import { CloneActivitiesOverlay } from '@/payload/collections/Activities/components/clone-activities-overlay'
import { User } from '@/payload-types'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { Payload } from 'payload'
import { compact, toNumber } from 'lodash-es'
import { isOrganisation } from '@/payload/assertions'

export const baseClass = 'clone-activity-button'
export const drawerSlug = 'clone-activities'

type Props = {
  user: User
  payload: Payload
}
export const CloneActivityButton: React.FC<Props> = async ({ user, payload }) => {
  if (!user) return null

  const selectedOrgId = toNumber(getIdFromRelation(user.selectedOrganisation))
  if (!selectedOrgId) return null

  const selectedOrganisationRole = user.organisations?.find(
    (org) => getIdFromRelation(org.organisation) === selectedOrgId,
  )?.roles

  if (!selectedOrganisationRole || !selectedOrganisationRole.includes(ROLE_SUPER_ADMIN)) return null

  const targetOrganisations = compact(
    user.organisations?.map((org) => {
      if (isOrganisation(org.organisation)) {
        return {
          label: org.organisation.name,
          value: toNumber(getIdFromRelation(org.organisation)),
        }
      }
    }),
  )

  const activities = await payload.find({
    collection: 'activities',
    where: {
      organisation: {
        equals: selectedOrgId,
      },
    },
    depth: 0,
  })

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
