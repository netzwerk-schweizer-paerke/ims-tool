import { Endpoint } from 'payload'
import { z } from 'zod'

import type { OrphanDeletionResult } from '@/lib/s3-orphan-detector'

import { S3OrphanDetector } from '@/lib/s3-orphan-detector'
import { ORPHAN_DELETE_ENABLED } from '@/lib/s3-orphan-safety'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { getErrorMessage } from '@/payload/utilities/cloning/error-utils'
import { formatValidationErrors } from '@/payload/utilities/cloning/validation-schemas'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'

/**
 * The caller names the keys it saw in a report. The server never derives the list itself,
 * so an operator can only delete what the report put in front of them.
 */
const bodySchema = z.object({
  keys: z.array(z.string().min(1).max(1024)).min(1).max(5000),
})

export type S3OrphanDeleteEndpointResult =
  | OrphanDeletionResult
  | ReturnType<typeof formatValidationErrors>
  | { error: string }

export const s3OrphanDeleteEndpoint: Endpoint = {
  handler: async (req) => {
    // The switch gates the endpoint, never the button alone. A super admin with a shell reaches
    // this handler directly, so a check that lives only in the drawer disarms nothing.
    if (!ORPHAN_DELETE_ENABLED) {
      return Response.json({ error: 'The S3 orphan deletion is turned off.' }, { status: 503 })
    }

    requireAuthentication(req)
    const user = req.user

    if (!checkUserRoles([ROLE_SUPER_ADMIN], user)) {
      req.payload.logger.warn({
        msg: 'S3 orphan deletion denied - super admin role required',
        userId: user?.id,
      })

      return Response.json({ error: 'Access denied. Super admin role required.' }, { status: 403 })
    }

    let body: z.infer<typeof bodySchema>

    try {
      const parsed = bodySchema.safeParse(req.json ? await req.json() : {})

      if (!parsed.success) {
        return Response.json(formatValidationErrors(parsed.error), { status: 400 })
      }

      body = parsed.data
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    try {
      const detector = new S3OrphanDetector(req)
      const result = await detector.deleteOrphans(body.keys)

      // A refusal is a client-correctable state, not a server fault, so it answers 409.
      if (result.refusedReason) {
        req.payload.logger.error({
          msg: 'S3 orphan deletion refused',
          reason: result.refusedReason,
          requested: result.requested,
          userId: user!.id,
        })

        return Response.json(result, { status: 409 })
      }

      req.payload.logger.warn({
        deleted: result.deleted.length,
        failed: result.failed.length,
        freedBytes: result.freedBytes,
        msg: 'S3 orphan deletion completed',
        requested: result.requested,
        skipped: result.skipped.length,
        userId: user!.id,
      })

      return Response.json(result, { status: 200 })
    } catch (error) {
      req.payload.logger.error({
        error: getErrorMessage(error),
        msg: 'S3 orphan deletion failed',
        requested: body.keys.length,
        stack: error instanceof Error ? error.stack : undefined,
        userId: user?.id,
      })

      return Response.json(
        { error: `S3 orphan deletion failed: ${getErrorMessage(error)}` },
        { status: 500 },
      )
    }
  },
  method: 'post',
  path: '/s3-orphan-delete',
}
