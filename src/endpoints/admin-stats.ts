import { Endpoint } from 'payload'

import type { AdminStatsReport } from '@/lib/admin-stats/types'

import { collectAdminStats } from '@/lib/admin-stats/collect-admin-stats'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { getErrorMessage } from '@/payload/utilities/cloning/error-utils'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'

export type AdminStatsEndpointResult = AdminStatsReport | { error: string }

export const adminStatsEndpoint: Endpoint = {
  handler: async (req) => {
    requireAuthentication(req)
    const user = req.user

    // The report reads every park with `overrideAccess: true`, so the role gate lives here.
    // Collection access cannot bound it. See `cross-tenant-reads-need-override-access`.
    if (!checkUserRoles([ROLE_SUPER_ADMIN], user)) {
      req.payload.logger.warn({
        msg: 'Admin statistics denied - super admin role required',
        userId: user?.id,
      })

      return Response.json({ error: 'Access denied. Super admin role required.' }, { status: 403 })
    }

    try {
      const report = await collectAdminStats(req.payload)

      req.payload.logger.info({
        msg: 'Admin statistics collected',
        parks: report.parks.length,
        userId: user!.id,
      })

      return Response.json(report, { status: 200 })
    } catch (error) {
      req.payload.logger.error({
        error: getErrorMessage(error),
        msg: 'Admin statistics failed',
        stack: error instanceof Error ? error.stack : undefined,
        userId: user?.id,
      })

      return Response.json(
        { error: `Admin statistics failed: ${getErrorMessage(error)}` },
        { status: 500 },
      )
    }
  },
  method: 'get',
  path: '/admin-stats',
}
