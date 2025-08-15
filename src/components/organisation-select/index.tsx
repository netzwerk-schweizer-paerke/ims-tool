import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { UserOrganisationSelect } from '@/components/organisation-select/dropdown'
import { Translate } from '@/lib/translate'
import { getPayload } from 'payload'
import config from '@payload-config'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { redirect, RedirectType } from 'next/navigation'
import { compact } from 'es-toolkit'

export const OrganisationSelect: React.FC = async () => {
  const headers = await getHeaders()
  const client = await getPayload({ config })

  const { user } = await client.auth({ headers })

  const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)

  const organisations = await client.find({
    collection: 'organisations',
    limit: 100,
    depth: 0,
  })

  let userOrganisations = compact(
    user?.organisations?.map((userOrg) => {
      if (!userOrg) return
      const thisOrg = organisations.docs.find(
        (org) => org.id === getIdFromRelation(userOrg.organisation),
      )
      if (!thisOrg) return
      return thisOrg
    }) ?? [],
  )

  // if the user is a super admin, show all organisations
  if (isSuperAdmin) {
    userOrganisations = organisations.docs
  }

  const selectedOrg = userOrganisations.find(
    (org) => org?.id === getIdFromRelation(user?.selectedOrganisation),
  )

  if (!userOrganisations || userOrganisations.length === 0) {
    return null
  }

  if (!selectedOrg && user) {
    await client.update({
      collection: 'users',
      id: user?.id,
      data: {
        selectedOrganisation: userOrganisations[0].id,
      },
    })
    redirect('/admin', RedirectType.replace)
  }

  if (!isSuperAdmin && user?.organisations?.length === 0) {
    return (
      <div className={'field-type mb-8 w-full'}>
        <div className={'rounded-lg border px-3 py-2'}>
          <p>
            <Translate k={'admin:selectOrganisations:noOrganisations'} />
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={'field-type mb-8 w-full'}>
      <label className="field-label">
        <Translate k={'admin:selectOrganisations:title'} />
      </label>
      <div className="field-type__wrap">
        <UserOrganisationSelect
          orgs={userOrganisations}
          userId={user?.id}
          selectedOrg={selectedOrg}
        />
      </div>
    </div>
  )
}
