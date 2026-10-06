import type { PayloadRequest } from 'payload'

import type { Activity } from '@/payload-types'

import { docOrderChanges, orderWithInsert } from '@/payload/utilities/cloning/activity-order'
import { CloneHttpError } from '@/payload/utilities/cloning/clone-http-error'
import { lockParkOrderForPaste } from '@/payload/utilities/cloning/lock-activity'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

/** "Davor" or "Danach" a Thema of the target park (PIMS-83). */
export type ActivityPosition = { anchorActivityId: number; placement: 'after' | 'before' }

type Variant = Activity['variant']

/**
 * Checks the anchor in phase 1 and answers its band. The anchor must belong to the target park,
 * so a paste can never reorder another park's landscape.
 */
export const resolveActivityAnchor = async (
  req: PayloadRequest,
  position: ActivityPosition,
  organisationId: number,
): Promise<Variant> => {
  const anchor = await req.payload.findByID({
    collection: 'activities',
    depth: 0,
    disableErrors: true,
    id: position.anchorActivityId,
    overrideAccess: true,
    req,
    select: { organisation: true, variant: true },
  })

  if (!anchor) {
    throw new CloneHttpError(`Anchor Thema ${position.anchorActivityId} not found`, 404)
  }

  if (getIdFromRelation(anchor.organisation) !== organisationId) {
    throw new CloneHttpError(`Anchor Thema ${position.anchorActivityId} is not in the target park`, 400)
  }

  return anchor.variant
}

/**
 * Gives the new Themen the anchor's band and puts them before or after the anchor. The landscape
 * sorts by `docOrder`, so the park's order is renumbered. Every write sets one column through the
 * database adapter, so no hook runs and no `updatedAt` changes.
 */
export const placeActivities = async ({
  newIds,
  organisationId,
  position,
  req,
  variant,
}: {
  newIds: number[]
  organisationId: number
  position: ActivityPosition
  req: PayloadRequest
  variant: Variant
}): Promise<void> => {
  await lockParkOrderForPaste(req, organisationId)

  for (const id of newIds) {
    await req.payload.db.updateOne({
      collection: 'activities',
      data: { variant },
      id,
      req,
      returning: false,
    })
  }

  const stored = await req.payload.find({
    collection: 'activities',
    depth: 0,
    limit: 0,
    overrideAccess: true,
    req,
    select: { docOrder: true },
    sort: 'docOrder',
    where: { organisation: { equals: organisationId } },
  })

  const order = orderWithInsert(
    stored.docs.map((doc) => doc.id),
    newIds,
    position.anchorActivityId,
    position.placement,
  )
  const changes = docOrderChanges(order, new Map(stored.docs.map((doc) => [doc.id, doc.docOrder])))

  for (const { docOrder, id } of changes) {
    await req.payload.db.updateOne({
      collection: 'activities',
      data: { docOrder },
      id,
      req,
      returning: false,
    })
  }
}
