import { DrawerToggler } from '@payloadcms/ui'
import { compact } from 'es-toolkit'
import { toNumber } from 'es-toolkit/compat'
import { DataFromCollectionSlug, Payload } from 'payload'
import React from 'react'

import { Translate } from '@/lib/translate'
import { I18nKeys } from '@/lib/use-translation-custom-types'
import { User } from '@/payload-types'
import { isOrganisation } from '@/payload/assertions'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

export interface GenericCloneButtonProps<TSlug extends CloneableSlug> {
  baseClass: string
  collectionSlug: TSlug
  drawerSlug: string
  /** The overlay receives the documents of the collection that `collectionSlug` names. */
  OverlayComponent: React.ComponentType<{
    documents: DataFromCollectionSlug<TSlug>[]
    targetOrganisations: { label: string; value: number }[]
  }>
  payload: Payload
  translationKey: I18nKeys
  user: User
}

/** The three collections that carry a clone endpoint. */
type CloneableSlug = 'activities' | 'task-flows' | 'task-lists'

export const GenericCloneButton = async <TSlug extends CloneableSlug>({
  baseClass,
  collectionSlug,
  drawerSlug,
  OverlayComponent,
  payload,
  translationKey,
  user,
}: GenericCloneButtonProps<TSlug>) => {
  if (!user) return null

  const selectedOrgId = toNumber(getIdFromRelation(user.selectedOrganisation))
  const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)

  const organisations = await payload.find({
    collection: 'organisations',
    depth: 0,
    limit: 0,
  })

  const documents = await payload.find({
    collection: collectionSlug,
    depth: 0,
    limit: 0,
    where: {
      organisation: {
        equals: selectedOrgId,
      },
    },
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
        <Translate k={translationKey} />
      </DrawerToggler>
      <OverlayComponent documents={documents.docs} targetOrganisations={targetOrganisations} />
    </div>
  )
}
