import { Endpoint } from 'payload'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { S3OrphanDetector } from '@/lib/s3-orphan-detector'

export interface OrphanReport {
  timestamp: string
  summary: {
    totalS3Objects: number
    totalReferencedFiles: number
    orphanedCount: number
    totalOrphanedSize: number
    totalOrphanedSizeFormatted: string
  }
  orphansByPrefix: Array<{
    prefix: string
    count: number
    totalSize: number
    objects: Array<{
      key: string
      size: number
      sizeFormatted: string
      lastModified: string
    }>
  }>
}

export const s3OrphanDetectionEndpoint: Endpoint = {
  path: '/s3-orphan-detection',
  method: 'get',
  handler: async (req) => {
    try {
      // Step 1: Verify authentication
      requireAuthentication(req)
      const user = req.user

      // Step 2: Verify super admin access
      const isSuperAdmin = checkUserRoles([ROLE_SUPER_ADMIN], user)
      if (!isSuperAdmin) {
        req.payload.logger.warn({
          msg: 'S3 orphan detection access denied - insufficient permissions',
          userId: user?.id,
          userRoles: user?.roles,
        })
        return Response.json(
          { error: 'Access denied. Super admin role required.' },
          { status: 403 },
        )
      }

      req.payload.logger.info({
        msg: 'S3 orphan detection started',
        userId: user!.id,
      })

      // Step 3: Execute S3 orphan detection
      const detector = new S3OrphanDetector(req)

      // We need to modify the detector to return the report instead of just displaying it
      const report = await detector.generateReportData()

      req.payload.logger.info({
        msg: 'S3 orphan detection completed successfully',
        userId: user!.id,
        orphanCount: report.summary.orphanedCount,
        totalSize: report.summary.totalOrphanedSizeFormatted,
      })

      return Response.json(report, { status: 200 })
    } catch (error) {
      req.payload.logger.error({
        msg: 'S3 orphan detection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      })

      return Response.json(
        {
          error: `S3 orphan detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 500 },
      )
    }
  },
}
