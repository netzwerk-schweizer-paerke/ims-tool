import { PayloadRequest } from 'payload'

import { User } from '@/payload-types'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'

type AccessValidationParams = {
  collectionSlug: 'activities' | 'task-flows' | 'task-lists'
  req: PayloadRequest
  sourceId: number | string
  targetOrgId: number
  user: null | User
}

type AccessValidationResult = {
  error?: {
    message: string
    status: number
  }
  isValid: boolean
}

export async function validateCloneAccess(
  params: AccessValidationParams,
): Promise<AccessValidationResult> {
  const { collectionSlug, req, sourceId, targetOrgId, user } = params

  if (!user) {
    return {
      error: {
        message: 'User not authenticated',
        status: 401,
      },
      isValid: false,
    }
  }

  const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)

  if (isSuperAdmin) {
    return { isValid: true }
  }

  // This read skips access control on purpose, and the two role checks below are the bound. The
  // caller's own read filter would strip `organisation` for a member who is not an admin of the
  // source park. See pitfalls/organisation-field-is-stripped-from-an-access-checked-read.
  const sourceDoc = await req.payload.findByID({
    collection: collectionSlug,
    depth: 0,
    id: sourceId,
    overrideAccess: true,
    req,
  })

  if (!sourceDoc) {
    return {
      error: {
        message: `Source ${collectionSlug.replace('-', ' ')} not found`,
        status: 404,
      },
      isValid: false,
    }
  }

  const sourceOrgId =
    typeof sourceDoc.organisation === 'number' ? sourceDoc.organisation : sourceDoc.organisation?.id

  const hasSourceAccess =
    sourceOrgId && checkOrganisationRoles([ROLE_USER, ROLE_SUPER_ADMIN], user, sourceOrgId)

  if (!hasSourceAccess) {
    req.payload.logger.warn({
      collectionSlug,
      msg: 'Access denied: User cannot read from source organization',
      sourceId,
      sourceOrgId,
      userId: user?.id,
      userRoles: user?.organisations?.map((o) => ({
        org: o.organisation,
        roles: o.roles,
      })),
    })
    return {
      error: {
        message: 'Access denied: You do not have permission to read from the source organization',
        status: 403,
      },
      isValid: false,
    }
  }

  const hasTargetAccess = checkOrganisationRoles([ROLE_SUPER_ADMIN], user, targetOrgId)

  if (!hasTargetAccess) {
    req.payload.logger.warn({
      collectionSlug,
      msg: 'Access denied: User cannot write to target organization',
      sourceId,
      targetOrgId,
      userId: user?.id,
    })
    return {
      error: {
        message: 'Access denied: You do not have admin permission in the target organization',
        status: 403,
      },
      isValid: false,
    }
  }

  return { isValid: true }
}
