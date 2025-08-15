import { DrawerToggler } from '@payloadcms/ui'
import { Translate } from '@/lib/translate'
import { User } from '@/payload-types'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { Payload } from 'payload'
import { compact } from 'es-toolkit'
import { toNumber } from 'es-toolkit/compat'
import { isOrganisation } from '@/payload/assertions'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import React from 'react'

export interface GenericCloneButtonProps {
  user: User
  payload: Payload
  collectionSlug: string
  translationKey: string
  drawerSlug: string
  baseClass: string
  OverlayComponent: React.ComponentType<any>
}

export const GenericCloneButton: React.FC<GenericCloneButtonProps> = async ({
  user,
  payload,
  collectionSlug,
  translationKey,
  drawerSlug,
  baseClass,
  OverlayComponent,
}) => {
  if (!user) return null

  const selectedOrgId = toNumber(getIdFromRelation(user.selectedOrganisation))
  const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)

  const organisations = await payload.find({
    collection: 'organisations',
    limit: 0,
    depth: 0,
  })

  const documents = await payload.find({
    collection: collectionSlug as any,
    where: {
      organisation: {
        equals: selectedOrgId,
      },
    },
    depth: 0,
  })

  if (!selectedOrgId) {
    payload.logger.warn({
      msg: `GenericCloneButton: No selected organisation found for user ${user.id}`,
    })
    return null
  }

  if (
    !checkOrganisationRoles([ROLE_USER, ROLE_SUPER_ADMIN], user, selectedOrgId) &&
    !isSuperAdmin
  ) {
    payload.logger.warn({
      msg: `GenericCloneButton: User ${user.id} does not have admin role in selected org or is not super admin`,
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
    (isSuperAdmin ? organisations.docs : userOrganisations).map((org) => {
      if (isOrganisation(org)) {
        return {
          label: org.name,
          value: toNumber(getIdFromRelation(org)),
        }
      }
    }),
  )

  if (!documents) return null
  if (documents.totalDocs === 0) return null

  return (
    <div>
      <DrawerToggler
        className={`${baseClass}__edit btn btn--size-medium btn--style-secondary`}
        slug={drawerSlug}>
        <Translate k={translationKey as any} />
      </DrawerToggler>
      <OverlayComponent documents={documents.docs} targetOrganisations={targetOrganisations} />
    </div>
  )
}
