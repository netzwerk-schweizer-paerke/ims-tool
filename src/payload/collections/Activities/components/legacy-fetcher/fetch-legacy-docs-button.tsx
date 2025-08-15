import { DrawerToggler } from '@payloadcms/ui'
import React from 'react'
import { FetchLegacyDocsOverlay } from './fetch-legacy-docs-overlay'
import { User } from '@/payload-types'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { Payload } from 'payload'
import { toNumber } from 'es-toolkit/compat'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'

export const baseClass = 'fetch-legacy-docs-button'
export const drawerSlug = 'fetch-legacy-docs'

type Props = {
  user: User
  payload: Payload
}

export const FetchLegacyDocsButton: React.FC<Props> = async ({ user, payload }) => {
  if (!user) return null

  const selectedOrgId = toNumber(getIdFromRelation(user.selectedOrganisation))
  const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)

  // Fetch activities from the selected organisation
  const activities = await payload.find({
    collection: 'activities',
    where: {
      organisation: {
        equals: selectedOrgId,
      },
    },
    depth: 0,
    limit: 1000, // Get all activities
  })

  if (!selectedOrgId) {
    payload.logger.warn({
      msg: `FetchLegacyDocsButton: No selected organisation found for user ${user.id}`,
    })
    return null
  }

  // Check if user has appropriate permissions
  if (
    !checkOrganisationRoles([ROLE_USER, ROLE_SUPER_ADMIN], user, selectedOrgId) &&
    !isSuperAdmin
  ) {
    payload.logger.warn({
      msg: `FetchLegacyDocsButton: User ${user.id} does not have admin role in selected org or is not super admin`,
    })
    return null
  }

  if (!activities || activities.totalDocs === 0) return null

  return (
    <div>
      <DrawerToggler
        className={`${baseClass}__edit btn btn--size-medium btn--style-secondary`}
        slug={drawerSlug}>
        Fetch Legacy Documents
      </DrawerToggler>
      <FetchLegacyDocsOverlay activities={activities.docs} />
    </div>
  )
}
