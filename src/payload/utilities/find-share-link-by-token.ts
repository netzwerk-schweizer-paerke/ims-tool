import type { Payload } from 'payload'

import { isShareLinkExpired } from '@/lib/share-link-expiry'
import { ShareLink } from '@/payload-types'

export type ShareLinkLookup =
  | { kind: 'expired' }
  | { kind: 'found'; link: ShareLink }
  | { kind: 'unknown' }

/**
 * The share link a public visitor addresses by token.
 *
 * Both public entry points call this, so the expiry rule cannot drift between the page and the
 * export. The read overrides access, because the visitor holds a token and no session. The token
 * is the only credential, and it never reaches a log line.
 */
export const findShareLinkByToken = async (
  payload: Payload,
  token: string,
): Promise<ShareLinkLookup> => {
  const link = await payload
    .find({
      collection: 'share-links',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { token: { equals: token } },
    })
    .then((res) => res.docs[0] ?? null)

  if (!link) {
    return { kind: 'unknown' }
  }

  return isShareLinkExpired(link.expiresAt, new Date())
    ? { kind: 'expired' }
    : { kind: 'found', link }
}
