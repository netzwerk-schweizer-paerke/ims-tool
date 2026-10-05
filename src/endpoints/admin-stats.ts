import { Endpoint } from 'payload'

import type { AdminStatsReport } from '@/lib/admin-stats/types'

import { collectAdminStats } from '@/lib/admin-stats/collect-admin-stats'
import { parkStatsToCsv } from '@/lib/admin-stats/park-csv'
import { de } from '@/lib/translations/de'
import { en } from '@/lib/translations/en'
import { fr } from '@/lib/translations/fr'
import { it } from '@/lib/translations/it'
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

const CATALOGUES = { de, en, fr, it }

/** The park table as a CSV download, in the admin language (PIMS-93). */
export const adminStatsCsvEndpoint: Endpoint = {
  handler: async (req) => {
    requireAuthentication(req)
    const user = req.user

    // The same gate as the JSON report, for the same reason.
    if (!checkUserRoles([ROLE_SUPER_ADMIN], user)) {
      req.payload.logger.warn({
        msg: 'Admin statistics CSV denied - super admin role required',
        userId: user?.id,
      })

      return Response.json({ error: 'Access denied. Super admin role required.' }, { status: 403 })
    }

    try {
      const report = await collectAdminStats(req.payload)
      const language = req.i18n.language
      const catalogue = Object.hasOwn(CATALOGUES, language)
        ? CATALOGUES[language as keyof typeof CATALOGUES]
        : de
      const { kpi, parkTable } = catalogue.statistics

      const csv = parkStatsToCsv(report.parks, {
        activeUsers: parkTable.activeUsers,
        activities: kpi.activities,
        documents: kpi.documents,
        language: parkTable.language,
        park: parkTable.park,
        storageBytes: parkTable.storageBytes,
        taskFlows: kpi.taskFlows,
        taskLists: kpi.taskLists,
        users: kpi.users,
      })

      return new Response(csv, {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Disposition': `attachment; filename="ims-statistik-${report.timestamp.slice(0, 10)}.csv"`,
          'Content-Type': 'text/csv; charset=utf-8',
        },
        status: 200,
      })
    } catch (error) {
      req.payload.logger.error({
        error: getErrorMessage(error),
        msg: 'Admin statistics CSV failed',
        stack: error instanceof Error ? error.stack : undefined,
        userId: user?.id,
      })

      return Response.json(
        { error: `Admin statistics CSV failed: ${getErrorMessage(error)}` },
        { status: 500 },
      )
    }
  },
  method: 'get',
  path: '/admin-stats/csv',
}
