import { PayloadRequest } from 'payload'

import { User } from '@/payload-types'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

export interface ResolveUploadOrganisationIdArgs {
  /** The hook's own `context` argument. A clone passes the target park through it. */
  context?: Record<string, unknown>
  /** The incoming document data, as the collection `beforeChange` hook receives it. */
  data?: null | Record<string, unknown>
  /** The stored row. Payload passes it on an update, and never on a create. */
  originalDoc?: null | Record<string, unknown>
  req: PayloadRequest
}

/**
 * Resolves the organisation an upload belongs to, for the S3 key prefix.
 *
 * The order mirrors `src/payload/fields/organisation/hooks/before-change-hook.ts`, which decides
 * the `organisation` column. Both must agree, or the stored prefix names a different park than the
 * row does. `payload/dist/collections/operations/create.js:121` runs the collection hook first, so
 * `data.organisation` here is still the caller's own value.
 */
export const resolveUploadOrganisationId = ({
  context,
  data,
  originalDoc,
  req,
}: ResolveUploadOrganisationIdArgs): null | number => {
  // A replaced file stays in the park that owns the row, whatever the caller has selected.
  const storedId = getIdFromRelation(originalDoc?.organisation)

  if (storedId !== null) {
    return storedId
  }

  const user = req.user as null | User

  // The organisation field hook returns early with no user, so the caller's own value stands.
  // Ignore the clone context here as well, because a clone always runs with a user.
  if (!user) {
    return getIdFromRelation(data?.organisation)
  }

  const contextId = positiveIntegerOf(
    context?.targetOrganisationId ?? req.context?.targetOrganisationId,
  )

  if (contextId !== null) {
    return contextId
  }

  const explicitId = getIdFromRelation(data?.organisation)

  if (explicitId !== null && checkUserRoles([ROLE_SUPER_ADMIN], user)) {
    return explicitId
  }

  return getIdFromRelation(user.selectedOrganisation)
}

/**
 * Narrows the clone context value to a usable organisation id.
 *
 * The field hook accepts any truthy value there, so a numeric string must resolve the same way.
 * Zero is not an id, and it must fall through rather than build the key `documents/0`.
 */
const positiveIntegerOf = (value: unknown): null | number => {
  if (typeof value !== 'number' && typeof value !== 'string') return null

  const parsed = Number(value)

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}
