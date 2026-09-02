import type { CollectionSlug, PayloadRequest } from 'payload'

import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

type Args = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  req: PayloadRequest
}

type Result = {
  isValid: boolean
  message?: string
  status?: number
}

/**
 * Decides whether the caller may translate one document.
 *
 * The translate operation writes with `overrideAccess: true`, because the translation
 * metadata field denies every update. The collection access rules therefore never run,
 * and this function is the only gate on the write.
 */
export const validateTranslateAccess = async (args: Args): Promise<Result> => {
  const { collectionSlug, globalSlug, id, req } = args
  const user = req.user

  if (!user) {
    return { isValid: false, message: 'User not authenticated', status: 401 }
  }

  if (checkUserRoles([ROLE_SUPER_ADMIN], user)) {
    return { isValid: true }
  }

  if (globalSlug || !collectionSlug || !id) {
    return { isValid: false, message: 'Only a super admin may translate this entity', status: 403 }
  }

  // `findByID` throws on an unknown slug before it consults `disableErrors`, and this runs
  // outside the endpoint's try block. Reject the slug here, or a bad name answers 500.
  const isKnownCollection = Object.hasOwn(req.payload.collections, collectionSlug)

  if (!isKnownCollection) {
    return { isValid: false, message: `Unknown collection: ${collectionSlug}`, status: 400 }
  }

  const doc = await req.payload.findByID({
    collection: collectionSlug as CollectionSlug,
    depth: 0,
    disableErrors: true,
    id,
    req,
  })

  if (!doc) {
    return { isValid: false, message: 'Document not found', status: 404 }
  }

  const docOrgId = getIdFromRelation((doc as { organisation?: unknown }).organisation)

  if (docOrgId === null) {
    return {
      isValid: false,
      message: 'Only a super admin may translate a document without an organisation',
      status: 403,
    }
  }

  if (!checkOrganisationRoles([ROLE_SUPER_ADMIN, ROLE_USER], user, docOrgId)) {
    req.payload.logger.warn(
      { collectionSlug, documentId: id, documentOrganisation: docOrgId, userId: user.id },
      'access_denied: translate requested for another organisation',
    )
    return {
      isValid: false,
      message: 'You do not have permission to translate this document',
      status: 403,
    }
  }

  return { isValid: true }
}
