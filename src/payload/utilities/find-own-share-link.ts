import type { Payload } from 'payload'

import { ShareTarget, shareTargetWhere } from '@/lib/share-link-target'

export type OwnShareLink = {
  id: number
  token: string
}

type Args = {
  organisationId: number
  payload: Payload
  target: ShareTarget
  userId: number
}

/**
 * The share link this user already created for this page, or null.
 *
 * The toolbar needs it to render the delete action on a fresh page load. A deliberate `limit: 1`
 * existence check, so the omitted-limit default of 10 does not apply.
 */
export const findOwnShareLink = async ({
  organisationId,
  payload,
  target,
  userId,
}: Args): Promise<null | OwnShareLink> => {
  const found = await payload.find({
    collection: 'share-links',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { createdBy: { equals: userId } },
        { organisation: { equals: organisationId } },
        shareTargetWhere(target),
      ],
    },
  })

  const doc = found.docs[0]

  return doc ? { id: doc.id, token: doc.token } : null
}
