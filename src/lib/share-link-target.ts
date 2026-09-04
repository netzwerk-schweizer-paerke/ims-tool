import type { Where } from 'payload'

import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

export type ShareTarget =
  | { activity: number; blockId: string; targetType: 'activityBlock' }
  | { targetType: 'activityLandscape' }
  | { targetType: 'flow'; taskFlow: number }
  | { targetType: 'list'; taskList: number }

/** The stored row, described structurally so this module needs no generated type. */
export type StoredShareLink = {
  activity?: null | number | { id: number }
  blockId?: null | string
  targetType?: null | string
  taskFlow?: null | number | { id: number }
  taskList?: null | number | { id: number }
}

type BuildShareUrlArgs = {
  locale?: null | string
  origin: string
  token: string
}

/**
 * The public address of a share link. The locale is cosmetic and the token is the secret, so a
 * visitor may change the locale in the URL.
 */
export const buildShareUrl = ({ locale, origin, token }: BuildShareUrlArgs): string => {
  const base = `${origin.replace(/\/+$/, '')}/share/${encodeURIComponent(token)}`
  return locale ? `${base}?locale=${encodeURIComponent(locale)}` : base
}

/** Reads a stored row back into a target. A row that names no resolvable page returns null. */
export const shareTargetFromLink = (link: StoredShareLink): null | ShareTarget => {
  switch (link.targetType) {
    case 'activityBlock': {
      const activity = getIdFromRelation(link.activity)
      if (typeof activity !== 'number' || !link.blockId) {
        return null
      }
      return { activity, blockId: link.blockId, targetType: 'activityBlock' }
    }
    case 'activityLandscape': {
      return { targetType: 'activityLandscape' }
    }
    case 'flow': {
      const taskFlow = getIdFromRelation(link.taskFlow)
      return typeof taskFlow === 'number' ? { targetType: 'flow', taskFlow } : null
    }
    case 'list': {
      const taskList = getIdFromRelation(link.taskList)
      return typeof taskList === 'number' ? { targetType: 'list', taskList } : null
    }
    default: {
      return null
    }
  }
}

/**
 * Matches every link that points at one page. The caller adds the owner and the organisation,
 * because a landscape target carries no id of its own.
 */
export const shareTargetWhere = (target: ShareTarget): Where => {
  switch (target.targetType) {
    case 'activityBlock': {
      return {
        and: [
          { targetType: { equals: 'activityBlock' } },
          { activity: { equals: target.activity } },
          { blockId: { equals: target.blockId } },
        ],
      }
    }
    case 'activityLandscape': {
      return { targetType: { equals: 'activityLandscape' } }
    }
    case 'flow': {
      return {
        and: [{ targetType: { equals: 'flow' } }, { taskFlow: { equals: target.taskFlow } }],
      }
    }
    case 'list': {
      return {
        and: [{ targetType: { equals: 'list' } }, { taskList: { equals: target.taskList } }],
      }
    }
  }
}
