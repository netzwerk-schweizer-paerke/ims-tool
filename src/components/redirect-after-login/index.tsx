import React from 'react'
import { payload } from '@/lib/payload'
import { headers as getHeaders } from 'next/headers'
import { compact } from 'lodash-es'
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation'
import { logger } from '@/lib/logger'

export const RedirectAfterLogin: React.FC = async () => {
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
    logger.warn('User does not have a UserOrganisation, redirecting to dashboard')
  }

  return (
    <div className={'field-type mb-8 w-full'}>
      <p>One moment, please...</p>
    </div>
  )
}
