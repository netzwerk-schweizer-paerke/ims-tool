import { PayloadRequest } from 'payload'
import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN, ROLE_USER } from '@/payload/utilities/constants'
import { User } from '@/payload-types'

type AccessValidationParams = {
  req: PayloadRequest
  user: User | null
  activityId: number
  targetOrgId: number
}

type AccessValidationResult = {
  isValid: boolean
  error?: {
    message: string
    status: number
  }
}

/**
 * Validates user access for cloning an activity from source to target organization
 * Super admins can clone from/to any org
 * Regular users need read access to source org and admin access to target org
 */
export async function validateCloneAccess(
  params: AccessValidationParams,
): Promise<AccessValidationResult> {
  const { req, user, activityId, targetOrgId } = params

  if (!user) {
    return {
      isValid: false,
      error: {
        message: 'User not authenticated',
        status: 401,
      },
    }
  }

  // Check if user is super admin (can clone from/to any org)
  const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)

  if (isSuperAdmin) {
    return { isValid: true }
  }

  // For non-super admins, we need to verify access to both source and target orgs

  // First, get the source activity to check its organization
  const sourceActivity = await req.payload.findByID({
    collection: 'activities',
    id: activityId,
    depth: 0,
  })

  if (!sourceActivity) {
    return {
      isValid: false,
      error: {
        message: 'Source activity not found',
        status: 404,
      },
    }
  }

  const sourceOrgId =
    typeof sourceActivity.organisation === 'number'
      ? sourceActivity.organisation
      : sourceActivity.organisation?.id

  // Check if user has at least read access to source organization
  const hasSourceAccess =
    sourceOrgId &&
    checkOrganisationRoles(
      [ROLE_USER, ROLE_SUPER_ADMIN], // USER role = read access
      user,
      sourceOrgId,
    )

  if (!hasSourceAccess) {
    req.payload.logger.warn({
      msg: 'Access denied: User cannot read from source organization',
      userId: user?.id,
      sourceOrgId,
      activityId,
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

  // Check if user has admin (write) access to target organization
  const hasTargetAccess = checkOrganisationRoles(
    [ROLE_SUPER_ADMIN], // Admin role in org = write access
    user,
    targetOrgId,
  )

  if (!hasTargetAccess) {
    req.payload.logger.warn({
      msg: 'Access denied: User cannot write to target organization',
      userId: user?.id,
      targetOrgId,
      activityId,
      userRoles: user?.organisations?.map((o) => ({
        org: o.organisation,
        roles: o.roles,
      })),
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
