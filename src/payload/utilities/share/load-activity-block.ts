import type { Payload, TypedLocale, Where } from 'payload'

import { logger } from '@/lib/logger'
import { Activity } from '@/payload-types'

export type ActivityBlock = NonNullable<Activity['blocks']>[number]

export type LoadedActivityBlock = {
  activity: Activity
  activityBlock: ActivityBlock | undefined
}

type Args = {
  activityId: number
  blockId: string
  locale?: TypedLocale
  organisationId: number
  payload: Payload
}

/**
 * Reads an activity and the one block the URL names.
 *
 * A block id belongs to one locale, so a fallback resolves the block by position. See the pitfall
 * page `block-id-is-per-locale`.
 */
export const loadActivityBlock = async ({
  activityId,
  blockId,
  locale,
  organisationId,
  payload,
}: Args): Promise<LoadedActivityBlock | null> => {
  const where: Where = {
    and: [{ id: { equals: activityId }, organisation: { equals: organisationId } }],
  }

  const activity = await payload
    .find({
      collection: 'activities',
      depth: 2,
      locale,
      // The public share page has no session. The organisation filter above scopes the read,
      // and it always comes from the caller, never from the URL.
      overrideAccess: true,
      where,
    })
    .then((res) => {
      if (res.docs.length === 0) {
        return null
      }
      if (res.docs.length > 1) {
        logger.warn('admin/views/activity/view/index: More than one activity found')
      }
      return res.docs[0]
    })

  if (!activity) {
    return null
  }

  const blocks = activity.blocks ?? []

  const resolveBlockByPosition = async (): Promise<ActivityBlock | undefined> => {
    const blocksPerLocale = await payload
      .find({
        collection: 'activities',
        depth: 0,
        locale: 'all',
        overrideAccess: true,
        where,
      })
      .then(
        (res) =>
          res.docs[0]?.blocks as unknown as Record<string, { id?: null | string }[]> | undefined,
      )

    for (const localeBlocks of Object.values(blocksPerLocale ?? {})) {
      const index = localeBlocks.findIndex((block) => block.id === blockId)
      if (index !== -1) {
        return blocks[index]
      }
    }

    return undefined
  }

  const activityBlock =
    blocks.find((block) => block.id === blockId) ?? (await resolveBlockByPosition())

  return { activity, activityBlock }
}
