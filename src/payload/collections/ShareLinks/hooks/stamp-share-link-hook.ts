import type { CollectionBeforeChangeHook, PayloadRequest } from 'payload'

import { randomBytes } from 'node:crypto'
import { APIError } from 'payload'

import { EXPIRY_MONTH_OPTIONS, expiryFromMonths, isExpiryMonths } from '@/lib/share-link-expiry'
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
 * The first read keeps `overrideAccess: false`, so no caller can mint a public link past their own
 * read access. The second read exists because the field's read rule strips `organisation` for a
 * member; see pitfalls/organisation-field-is-stripped-from-an-access-checked-read.
 */
const resolveTargetOrganisation = async (
  target: ShareTarget,
  req: PayloadRequest,
): Promise<null | number> => {
  const user = req.user

  if (!user) {
    return null
  }

  // Every branch proves membership, because a user can write `selectedOrganisation` on themselves.
  const isMemberOf = (organisationId: number): boolean =>
    checkUserRoles([ROLE_SUPER_ADMIN], user) ||
    checkOrganisationRoles([ROLE_SUPER_ADMIN, ROLE_USER], user, organisationId)

  if (target.targetType === 'activityLandscape') {
    // The landscape is the whole park, so it carries no record. Fall back to the selected park.
    const organisationId = getIdFromRelation(user.selectedOrganisation)

    if (organisationId === null) {
      return null
    }

    return isMemberOf(organisationId) ? organisationId : null
  }

  const id = targetRecordId(target)

  if (id === null) {
    return null
  }

  const collection = TARGET_COLLECTIONS[target.targetType]

  // `disableErrors` turns a denied read into an empty page, so the caller gets this hook's own
  // 403 message rather than Payload's generic one.
  const readable = await req.payload.find({
    collection,
    depth: 0,
    disableErrors: true,
    limit: 1,
    overrideAccess: false,
    req,
    user,
    where: { id: { equals: id } },
  })

  if (readable.docs.length === 0) {
    return null
  }

  // The caller's own read passed, so this override reads one row they already proved they may
  // see. The membership check below bounds the override on its own.
  const row = await req.payload.findByID({
    collection,
    depth: 0,
    disableErrors: true,
    id,
    overrideAccess: true,
    req,
    select: { organisation: true },
  })

  const organisationId = getIdFromRelation(row?.organisation)

  if (organisationId === null) {
    return null
  }

  return isMemberOf(organisationId) ? organisationId : null
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
    throw new APIError(
      `A share link expires after one of ${EXPIRY_MONTH_OPTIONS.join(', ')} months.`,
      400,
    )
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
