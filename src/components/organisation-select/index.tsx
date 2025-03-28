import React from 'react'
import { payload } from '@/lib/payload'
import { headers as getHeaders } from 'next/headers'
import { compact } from 'lodash-es'
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation'
import { UserOrganisationSelect } from '@/components/organisation-select/dropdown'
import { Translate } from '@/lib/translate'

export const OrganisationSelect: React.FC = async () => {
  const headers = await getHeaders()
  const client = await payload()

  const { user } = await client.auth({ headers })

  const organisations = await client.find({
    collection: 'organisations',
    limit: 100,
  })

  const userOrganisations = compact(
    user?.organisations?.map((userOrg) => {
      if (!userOrg) return

      const thisOrg = organisations.docs.find(
        (org) => org.id === getIdFromRelation(userOrg.organisation),
      )
      if (!thisOrg) return
      return thisOrg
    }),
  )

  if (!userOrganisations || userOrganisations.length < 2) {
    return null
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
          selectedOrgId={user?.selectedOrganisation}
        />
      </div>
    </div>
  )
}
