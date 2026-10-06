import type { PayloadRequest, TypedLocale } from 'payload'

import {
  appendTaskRelation,
  findBlockIndex,
  type StoredBlock,
  type TaskCollection,
  type TaskPosition,
} from '@/payload/utilities/cloning/block-position'
import { CloneHttpError } from '@/payload/utilities/cloning/clone-http-error'
import { lockActivityForPaste } from '@/payload/utilities/cloning/lock-activity'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

/** A Prozessgruppe: one task block of one activity (PIMS-83). */
export type BlockTarget = { activityId: number; blockId: string; position?: TaskPosition }

export type ResolvedBlockTarget = { activityId: number; blockIndex: number; organisationId: number }

/**
 * Checks a paste target before anything is written, and answers the block position.
 *
 * The target may sit in a park the caller has not selected, so the read overrides access. The
 * caller's role in `organisationId` is the bound, and this check ties the block to that park.
 */
export const resolveBlockTarget = async (
  req: PayloadRequest,
  target: BlockTarget,
  organisationId: number,
): Promise<ResolvedBlockTarget> => {
  const activity = await req.payload.findByID({
    collection: 'activities',
    depth: 0,
    disableErrors: true,
    id: target.activityId,
    locale: 'all',
    overrideAccess: true,
    req,
    select: { blocks: true, organisation: true },
  })

  if (!activity) {
    throw new CloneHttpError(`Target activity ${target.activityId} not found`, 404)
  }

  if (getIdFromRelation(activity.organisation) !== organisationId) {
    throw new CloneHttpError(`Target activity ${target.activityId} is not in the target park`, 400)
  }

  const blocksPerLocale = activity.blocks as unknown as Record<string, null | StoredBlock[]>
  const blockIndex = findBlockIndex(blocksPerLocale ?? {}, target.blockId)

  if (blockIndex === -1) {
    throw new CloneHttpError(`Target block ${target.blockId} not found`, 404)
  }

  const isTaskBlock = Object.values(blocksPerLocale ?? {}).some(
    (blocks) => blocks?.[blockIndex]?.blockType === 'activity-task',
  )

  if (!isTaskBlock) {
    throw new CloneHttpError('Only a Prozessgruppe can receive a Prozess or a Liste', 400)
  }

  return { activityId: target.activityId, blockIndex, organisationId }
}

/**
 * Links a task to the block at `blockIndex`, in every locale that holds a block there.
 *
 * Each locale is read without a fallback. A fallback read answers the German blocks with their
 * German ids, and writing those into another locale fails the uniqueness check.
 */
export const attachTaskToBlock = async ({
  cloneLocales,
  position,
  req,
  target,
  task,
}: {
  cloneLocales: TypedLocale[]
  /** "Davor" or "Danach" a task of the same Prozessgruppe. Without it the task goes last. */
  position?: TaskPosition
  req: PayloadRequest
  target: ResolvedBlockTarget
  task: { id: number; relationTo: TaskCollection }
}): Promise<number> => {
  let written = 0

  await lockActivityForPaste(req, target.activityId)

  for (const locale of cloneLocales) {
    const activity = await req.payload.findByID({
      collection: 'activities',
      depth: 0,
      fallbackLocale: false,
      id: target.activityId,
      locale,
      overrideAccess: true,
      req,
    })

    const blocks = (activity.blocks ?? []) as unknown as StoredBlock[]
    const next = appendTaskRelation(blocks, target.blockIndex, task, position)

    if (!next) {
      continue
    }

    await req.payload.update({
      collection: 'activities',
      data: { blocks: next as unknown as typeof activity.blocks },
      id: target.activityId,
      locale,
      overrideAccess: true,
      // Without the target park in the context, the organisation hook writes the caller's
      // selected park onto the Thema, and the Thema leaves its park.
      req: mergeReqContextTargetOrgId(req, target.organisationId),
    })

    written += 1
  }

  return written
}
