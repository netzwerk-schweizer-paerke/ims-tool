import { Endpoint } from 'payload'
import { z } from 'zod'

import { TenantHealthChecker, TenantHealthReport } from '@/lib/tenant-health-checker'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { getErrorStatus } from '@/payload/utilities/cloning/clone-http-error'
import { getErrorMessage } from '@/payload/utilities/cloning/error-utils'
import { formatValidationErrors } from '@/payload/utilities/cloning/validation-schemas'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'

const CHECKABLE_COLLECTIONS = ['activities', 'task-flows', 'task-lists'] as const

/**
 * Two scopes: a whole park, or a single document.
 *
 * They carry different access rules, so they are separate shapes rather than one object
 * with optional fields — see the handler.
 */
const bodySchema = z.intersection(
  z.union([
    z.object({ organisationId: z.number().min(1) }),
    z.object({ collection: z.enum(CHECKABLE_COLLECTIONS), id: z.number().min(1) }),
  ]),
  z.object({ checkExternalUrls: z.boolean().optional() }),
)

export type TenantHealthEndpointResult =
  ReturnType<typeof formatValidationErrors> | TenantHealthReport | { error: string }

export const tenantHealthEndpoint: Endpoint = {
  handler: async (req) => {
    requireAuthentication(req)
    const user = req.user

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

    const checker = new TenantHealthChecker(req.payload)

    try {
      if ('organisationId' in body) {
        // A park-wide sweep reads with overrideAccess and can name rows in other
        // organisations, so it stays super-admin only.
        if (!checkUserRoles([ROLE_SUPER_ADMIN], user)) {
          req.payload.logger.warn({
            msg: 'Tenant health check denied - super admin role required',
            organisationId: body.organisationId,
            userId: user?.id,
          })
          return Response.json(
            { error: 'Access denied. Super admin role required.' },
            { status: 403 },
          )
        }

        const report = await checker.run(body.organisationId, {
          checkExternalUrls: body.checkExternalUrls,
        })

        req.payload.logger.info({
          blocking: report.summary.blocking,
          degrading: report.summary.degrading,
          msg: 'Tenant health check completed',
          organisationId: body.organisationId,
          userId: user!.id,
        })

        return Response.json(report, { status: 200 })
      }

      // Document scope: anyone who may read the row may check it. Loading it with the
      // caller's own `req` applies the normal organisation filter, so a park user can
      // check their own items and gets a 404 for anyone else's.
      await req.payload.findByID({
        collection: body.collection,
        depth: 0,
        id: body.id,
        req,
      })

      const report = await checker.runForDocument(body.collection, body.id, {
        checkExternalUrls: body.checkExternalUrls,
      })

      req.payload.logger.info({
        blocking: report.summary.blocking,
        collection: body.collection,
        degrading: report.summary.degrading,
        documentId: body.id,
        msg: 'Document health check completed',
        userId: user!.id,
      })

      return Response.json(report, { status: 200 })
    } catch (error) {
      const status = getErrorStatus(error)

      req.payload.logger.error({
        body,
        error: getErrorMessage(error),
        msg: 'Health check failed',
        stack: error instanceof Error ? error.stack : undefined,
        status,
        userId: user?.id,
      })

      return Response.json({ error: `Health check failed: ${getErrorMessage(error)}` }, { status })
    }
  },
  method: 'post',
  path: '/tenant-health',
}
