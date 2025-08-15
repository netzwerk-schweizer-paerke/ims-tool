import { PayloadRequest } from 'payload'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { User } from '@/payload-types'

type AccessValidationParams = {
  req: PayloadRequest
  user: User | null
  sourceId: number | string
  targetOrgId: number
  collectionSlug: 'activities' | 'task-flows' | 'task-lists'
}

type AccessValidationResult = {
  isValid: boolean
  error?: {
    message: string
    status: number
  }
}

export async function validateCloneAccess(
  params: AccessValidationParams,
): Promise<AccessValidationResult> {
  const { req, user, sourceId, targetOrgId, collectionSlug } = params

  if (!user) {
    return {
      isValid: false,
      error: {
        message: 'User not authenticated',
        status: 401,
      },
    }
  }

  const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)

  if (isSuperAdmin) {
    return { isValid: true }
  }

  const sourceDoc = await req.payload.findByID({
    collection: collectionSlug,
    id: sourceId,
    depth: 0,
  })

  if (!sourceDoc) {
    return {
      isValid: false,
      error: {
        message: `Source ${collectionSlug.replace('-', ' ')} not found`,
        status: 404,
      },
    }
  }

  const sourceOrgId =
    typeof sourceDoc.organisation === 'number' ? sourceDoc.organisation : sourceDoc.organisation?.id

  const hasSourceAccess =
    sourceOrgId && checkOrganisationRoles([ROLE_USER, ROLE_SUPER_ADMIN], user, sourceOrgId)

  if (!hasSourceAccess) {
    req.payload.logger.warn({
      msg: 'Access denied: User cannot read from source organization',
      userId: user?.id,
      sourceOrgId,
      sourceId,
      collectionSlug,
      userRoles: user?.organisations?.map((o) => ({
        org: o.organisation,
        roles: o.roles,
      })),
    })
    return {
      isValid: false,
      error: {
        message: 'Access denied: You do not have permission to read from the source organization',
        status: 403,
      },
    }
  }

  const hasTargetAccess = checkOrganisationRoles([ROLE_SUPER_ADMIN], user, targetOrgId)

  if (!hasTargetAccess) {
    req.payload.logger.warn({
      msg: 'Access denied: User cannot write to target organization',
      userId: user?.id,
      targetOrgId,
      sourceId,
      collectionSlug,
    })
    return {
      isValid: false,
      error: {
        message: 'Access denied: You do not have admin permission in the target organization',
        status: 403,
      },
    }
  }

  return { isValid: true }
}
