import { Endpoint, PayloadRequest } from 'payload'
import { getRequestData } from '@/payload/utilities/endpoints/get-request-data'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'
import { toNumber } from 'lodash-es'
import { validateCloneAccess } from '@/payload/collections/Activities/endpoints/clone-activity/utils/validate-access'
import { executeActivityClone } from '@/payload/collections/Activities/endpoints/clone-activity/utils/execute-activity-clone'
import { getLocaleCodesFromRequest } from '@/lib/locale-utils'

type EndpointRequestData = {
  params: {
    activityId: number
    organisationId: number
  }
  query?: {
    failTest?: boolean
    locale: string
  }
}

/**
 * Transaction-safe version of the cloneActivity endpoint
 */
export const cloneActivityTransactional: Endpoint = {
  path: '/:activityId/organisation/:organisationId',
  method: 'post',
  handler: async (req) => {
    requireAuthentication(req)
    const { params } = await getRequestData<EndpointRequestData>(req)
    const { activityId, organisationId } = params || {}
    const user = req.user

    // Extract query parameters from the URL
    let failTest = false
    let locale = req.locale

    if (req.url) {
      try {
        // Parse the URL to get query parameters safely
        const url = new URL(req.url, `http://localhost`)
        const searchParams = url.searchParams

        failTest = searchParams.get('failTest') === 'true'

        const locales = getLocaleCodesFromRequest(req)

        // Handle locale parameter with proper type checking
        const localeParam = searchParams.get('locale')
        if (localeParam && locales.includes(localeParam)) {
          locale = localeParam as typeof locale
        }
      } catch (error) {
        // If URL parsing fails, use defaults
        req.payload.logger.warn({
          msg: 'Failed to parse URL parameters',
          error: error instanceof Error ? error.message : 'Unknown error',
          url: req.url,
        })
      }
    }

    const targetOrgId = toNumber(organisationId)

    if (!activityId || !targetOrgId) {
      return Response.json({ error: 'Missing activityId or organisationId' }, { status: 400 })
    }

    // Step 1: Validate access permissions
    const accessValidation = await validateCloneAccess({
      req,
      user,
      activityId,
      targetOrgId,
    })

    if (!accessValidation.isValid) {
      return Response.json(
        { error: accessValidation.error?.message },
        { status: accessValidation.error?.status || 403 },
      )
    }

    // Start a database transaction
    const transactionID = await req.payload.db.beginTransaction()

    if (!transactionID) {
      return Response.json({ error: 'Failed to start database transaction' }, { status: 500 })
    }

    try {
      req.payload.logger.info({
        msg: 'cloning activity with transaction',
        activityId,
        targetOrgId,
        locale,
        localeType: typeof locale,
        transactionID,
      })

      // Create a new request object with the transaction ID
      const transactionalReq: PayloadRequest = {
        ...req,
        transactionID,
      }

      // Find the source activity
      const sourceActivity = await req.payload.findByID({
        req: transactionalReq,
        collection: 'activities',
        id: activityId,
        locale: locale as any,
        depth: 0,
      })

      if (!sourceActivity) {
        throw new Error('Source activity not found')
      }

      // Execute the cloning process
      const result = await executeActivityClone({
        req: transactionalReq,
        sourceActivity,
        targetOrgId,
        locale,
        failTest,
      })

      // If we've made it this far, commit the transaction
      await req.payload.db.commitTransaction(transactionID)

      req.payload.logger.info({
        msg: 'Activity cloned successfully',
        sourceId: activityId,
        clonedId: result.clonedActivityId,
        transactionID,
        statistics: result.statistics,
      })

      return Response.json(
        {
          message: 'Activity cloned successfully',
          activityId: result.clonedActivityId,
          statistics: result.statistics,
        },
        { status: 200 },
      )
    } catch (error) {
      // If anything goes wrong, rollback the entire transaction
      await req.payload.db.rollbackTransaction(transactionID)

      req.payload.logger.error({
        msg: 'Failed to clone activity - transaction rolled back',
        error: error instanceof Error ? error.message : 'Unknown error',
        activityId,
        targetOrgId,
        transactionID,
      })

      return Response.json(
        {
          error: `Failed to clone activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 500 },
      )
    }
  },
}
