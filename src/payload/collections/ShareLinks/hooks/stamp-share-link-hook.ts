import type { CollectionBeforeChangeHook, PayloadRequest } from 'payload'

import { randomBytes } from 'node:crypto'
import { APIError } from 'payload'

import {
  expiryFromMonths,
  isExpiryMonths,
  MAX_EXPIRY_MONTHS,
} from '@/lib/share-link-expiry'
import { ShareTarget, shareTargetFromLink, StoredShareLink } from '@/lib/share-link-target'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

/** 16 random bytes, so guessing a token is not feasible. */
const TOKEN_BYTES = 16

type ShareLinkData = StoredShareLink & {
  createdBy?: unknown
  expiresAt?: unknown
  expiresInMonths?: unknown
  organisation?: unknown
  token?: unknown
}

const TARGET_COLLECTIONS = {
  activityBlock: 'activities',
  flow: 'task-flows',
  list: 'task-lists',
} as const

const targetRecordId = (target: ShareTarget): null | number => {
  switch (target.targetType) {
    case 'activityBlock': {
      return target.activity
    }
    case 'activityLandscape': {
      return null
    }
    case 'flow': {
      return target.taskFlow
    }
    case 'list': {
      return target.taskList
    }
  }
}

/**
 * The organisation that owns the shared page, or null when the caller may not see it.
 *
 * The read runs with `overrideAccess: false` on purpose. Without it any authenticated user could
 * mint a public link to another park's page, because the link itself needs no session to open.
 */
const resolveTargetOrganisation = async (
  target: ShareTarget,
  req: PayloadRequest,
): Promise<null | number> => {
  const user = req.user

  if (!user) {
    return null
  }

  if (target.targetType === 'activityLandscape') {
    // The landscape is the whole park, so it carries no record. Fall back to the selected park,
    // and prove membership, because a user can write `selectedOrganisation` on themselves.
    const organisationId = getIdFromRelation(user.selectedOrganisation)

    if (organisationId === null) {
      return null
    }

    const member =
      checkUserRoles([ROLE_SUPER_ADMIN], user) ||
      checkOrganisationRoles([ROLE_SUPER_ADMIN, ROLE_USER], user, organisationId)

    return member ? organisationId : null
  }

  const id = targetRecordId(target)

  if (id === null) {
    return null
  }

  const found = await req.payload.find({
    collection: TARGET_COLLECTIONS[target.targetType],
    depth: 0,
    limit: 1,
    overrideAccess: false,
    req,
    user,
    where: { id: { equals: id } },
  })

  return found.docs.length === 0 ? null : getIdFromRelation(found.docs[0]?.organisation)
}

/**
 * The month count the caller chose, or null for a link that never expires.
 *
 * An out-of-range value is refused rather than clamped, because a silent clamp hides a broken
 * caller. `expiresAt` denies a client write, so this count is the only way to set the expiry.
 */
const resolveExpiryMonths = (value: unknown): null | number => {
  if (value === null || value === undefined) {
    return null
  }

  if (!isExpiryMonths(value)) {
    throw new APIError(`A share link expires after 1 to ${MAX_EXPIRY_MONTHS} months.`, 400)
  }

  return value
}

/**
 * Stamps the token, the creator, the organisation and the expiry on a new share link.
 *
 * A share link opens without a session, so these values must never come from the client.
 * `createdBy` also carries the delete rule. The token stays out of every log line, because tslog
 * runs in pretty mode and a caller could forge a log entry.
 */
export const stampShareLinkHook: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') {
    return data
  }

  const incoming: ShareLinkData = data

  if (!req.user) {
    throw new APIError('A share link needs an authenticated creator.', 401)
  }

  const target = shareTargetFromLink(incoming)

  if (!target) {
    throw new APIError('The share link names no page that can be resolved.', 400)
  }

  const organisation = await resolveTargetOrganisation(target, req)

  if (organisation === null) {
    throw new APIError('The share link names a page you cannot read.', 403)
  }

  const expiresInMonths = resolveExpiryMonths(incoming.expiresInMonths)

  return {
    ...incoming,
    createdBy: req.user.id,
    // The server clock decides the instant. A browser clock never reaches this value.
    expiresAt:
      expiresInMonths === null ? null : expiryFromMonths(expiresInMonths, new Date()).toISOString(),
    expiresInMonths,
    organisation,
    token: randomBytes(TOKEN_BYTES).toString('base64url'),
  }
}
