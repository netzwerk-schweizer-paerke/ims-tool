import type { Payload } from 'payload'

import { isShareLinkExpired } from '@/lib/share-link-expiry'
import { ShareTarget, shareTargetWhere } from '@/lib/share-link-target'

export type OwnShareLink = {
  /** Resolved here, so no clock runs during the client render and hydration matches. */
  expired: boolean
  expiresAt: null | string
  id: number
  token: string
}

type Args = {
  organisationId: number
  payload: Payload
  target: ShareTarget
  userId: number
}

/** One page holds a handful of links. The cap keeps the query bounded. */
const MAX_LINKS = 50

/**
 * Every share link this user created for this page, newest first.
 *
 * An expired row stays in the list and carries `expired`, so the creator can still delete it. The
 * sort reads `id`, because a caller can write `createdAt` through the REST API.
 */
export const findOwnShareLinks = async ({
  organisationId,
  payload,
  target,
  userId,
}: Args): Promise<OwnShareLink[]> => {
  const found = await payload.find({
    collection: 'share-links',
    depth: 0,
    limit: MAX_LINKS,
    overrideAccess: true,
    sort: '-id',
    where: {
      and: [
        { createdBy: { equals: userId } },
        { organisation: { equals: organisationId } },
        shareTargetWhere(target),
      ],
    },
  })

  const now = new Date()

  return found.docs.map((doc) => ({
    expired: isShareLinkExpired(doc.expiresAt, now),
    expiresAt: doc.expiresAt ?? null,
    id: doc.id,
    token: doc.token,
  }))
}
