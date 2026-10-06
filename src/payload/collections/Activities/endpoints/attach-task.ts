import type { Endpoint } from 'payload'

import { z } from 'zod'

import { checkOrganisationRoles } from '@/payload/utilities/check-organisation-roles'
import { checkUserRoles } from '@/payload/utilities/check-user-roles'
import { attachTaskToBlock, resolveBlockTarget } from '@/payload/utilities/cloning/attach-task-to-block'
import { getErrorStatus } from '@/payload/utilities/cloning/clone-http-error'
import { getCloneLocales } from '@/payload/utilities/cloning/clone-locales'
import { getErrorMessage } from '@/payload/utilities/cloning/error-utils'
import { taskPositionSchema } from '@/payload/utilities/cloning/task-position-schema'
import { formatValidationErrors } from '@/payload/utilities/cloning/validation-schemas'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

const bodySchema = z.object({
  blockId: z.string().min(1),
  collection: z.enum(['task-flows', 'task-lists']),
  // "Davor" or "Danach" a task of the same Prozessgruppe. Absent, the task goes last.
  position: taskPositionSchema.optional(),
  taskId: z.number().min(1),
})

/**
 * `POST /api/activities/:id/attach-task` — a paste of a Prozess or a Liste inside one park
 * (PIMS-83). It copies nothing. It links the existing task to one Prozessgruppe of the activity.
 *
 * A paste into another park clones the task instead, through `/clone` with a `target`.
 */
export const attachTaskEndpoint: Endpoint = {
  handler: async (req) => {
    requireAuthentication(req)
    const user = req.user
    const activityId = Number(req.routeParams?.id)

    const parsed = bodySchema.safeParse(req.json ? await req.json() : {})

    if (!parsed.success || !Number.isSafeInteger(activityId) || activityId < 1) {
      return Response.json(
        parsed.success ? { error: 'Invalid activity id' } : formatValidationErrors(parsed.error),
        { status: 400 },
      )
    }

    const { blockId, collection, position, taskId } = parsed.data

    const activity = await req.payload.findByID({
      collection: 'activities',
      depth: 0,
      disableErrors: true,
      id: activityId,
      overrideAccess: true,
      req,
      select: { organisation: true },
    })
    const organisationId = getIdFromRelation(activity?.organisation)

    if (!activity || organisationId === null) {
      return Response.json({ error: 'Activity not found' }, { status: 404 })
    }

    // The same rule as a clone into this park: a super admin, or an admin of the park.
    const mayWrite =
      checkUserRoles([ROLE_SUPER_ADMIN], user) ||
      checkOrganisationRoles([ROLE_SUPER_ADMIN], user, organisationId)

    if (!mayWrite) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const task = await req.payload.findByID({
      collection,
      depth: 0,
      disableErrors: true,
      id: taskId,
      overrideAccess: true,
      req,
      select: { organisation: true },
    })

    // A link across parks would show one park's task in another park's landscape.
    if (!task || getIdFromRelation(task.organisation) !== organisationId) {
      return Response.json({ error: 'The task is not in the park of this activity' }, { status: 400 })
    }

    let transactionID: null | number | string = null

    try {
      const target = await resolveBlockTarget(req, { activityId, blockId }, organisationId)

      transactionID = (await req.payload.db.beginTransaction()) ?? null

      const written = await attachTaskToBlock({
        cloneLocales: getCloneLocales(req.payload.config),
        position,
        req: transactionID === null ? req : { ...req, transactionID },
        target,
        task: { id: taskId, relationTo: collection },
      })

      if (transactionID !== null) {
        await req.payload.db.commitTransaction(transactionID)
      }

      // No locale took the task, because the Prozessgruppe already links it. A 200 would let
      // the menu report a paste that changed nothing.
      if (written === 0) {
        return Response.json(
          { error: 'The Prozessgruppe already links this task' },
          { status: 409 },
        )
      }

      return Response.json({ locales: written }, { status: 200 })
    } catch (error) {
      if (transactionID !== null) {
        await req.payload.db.rollbackTransaction(transactionID)
      }

      req.payload.logger.error({
        activityId,
        blockId,
        error: getErrorMessage(error),
        msg: 'Failed to attach a task to a Prozessgruppe',
        taskId,
      })

      return Response.json({ error: getErrorMessage(error) }, { status: getErrorStatus(error) })
    }
  },
  method: 'post',
  path: '/:id/attach-task',
}
