import type { Payload, TypedLocale } from 'payload'

import { Activity } from '@/payload-types'

export type LoadedLandscape = {
  standardActivities: Activity[]
  strategicActivities: Activity[]
  supportActivities: Activity[]
}

type Args = {
  locale?: TypedLocale
  organisationId: number
  payload: Payload
}

/** Reads every activity of one park, split into the three rows the landscape draws. */
export const loadLandscape = async ({
  locale,
  organisationId,
  payload,
}: Args): Promise<LoadedLandscape> => {
  const activities = await payload
    .find({
      collection: 'activities',
      depth: 2,
      // An omitted limit resolves to 10, which would drop the rest of a larger park in silence.
      limit: 0,
      locale,
      // The public share page has no session. The organisation filter scopes the read, and it
      // always comes from the caller, never from the URL.
      overrideAccess: true,
      sort: 'docOrder',
      where: { organisation: { equals: organisationId } },
    })
    .then((res) => res.docs)

  return {
    standardActivities: activities.filter((activity) => activity.variant === 'standard'),
    strategicActivities: activities.filter((activity) => activity.variant === 'strategyActivity'),
    supportActivities: activities.filter((activity) => activity.variant === 'supportActivity'),
  }
}
