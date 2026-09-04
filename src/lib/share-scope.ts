import { toNumber } from 'es-toolkit/compat'

import { ShareTarget, shareTargetFromLink, StoredShareLink } from '@/lib/share-link-target'

/**
 * The page a share link may open, or null.
 *
 * A landscape link covers the whole park, so its holder may open any page of it. A link to one
 * page covers that page alone, and a deeper path under it resolves to nothing.
 *
 * The page and the PDF route both call this, so an export can never reach further than the screen.
 */
export const resolveRequestedTarget = (
  link: StoredShareLink,
  view: string[],
): null | ShareTarget => {
  const granted = shareTargetFromLink(link)

  if (!granted) {
    return null
  }

  if (view.length === 0) {
    return granted
  }

  if (granted.targetType !== 'activityLandscape') {
    return null
  }

  if (view.length === 2 && view[0] === 'flow') {
    const taskFlow = toNumber(view[1])
    return taskFlow ? { targetType: 'flow', taskFlow } : null
  }

  if (view.length === 2 && view[0] === 'list') {
    const taskList = toNumber(view[1])
    return taskList ? { targetType: 'list', taskList } : null
  }

  if (view.length === 4 && view[0] === 'activity' && view[2] === 'block') {
    const activity = toNumber(view[1])
    return activity && view[3] ? { activity, blockId: view[3], targetType: 'activityBlock' } : null
  }

  return null
}

/** Splits a `view` query such as `flow/817` into the segments the resolver expects. */
export const parseViewQuery = (value: null | string | undefined): string[] =>
  value ? value.split('/').filter(Boolean) : []
