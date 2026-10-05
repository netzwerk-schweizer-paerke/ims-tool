/**
 * The copy and paste of PIMS-83. An item pastes only one level up: a Thema into a landscape, a
 * Prozessgruppe into a Thema, a Prozess or a Liste into a Prozessgruppe.
 *
 * The browser keeps the item as a Payload preference. The server reads the source park again
 * from the record, so a changed preference cannot move content across parks.
 */
export type ClipboardItem =
  | {
      activityId: number
      blockId: string
      kind: 'activityBlock'
      label: string
      organisationId: number
    }
  | { id: number; kind: 'activity'; label: string; organisationId: number }
  | { id: number; kind: 'task-flows' | 'task-lists'; label: string; organisationId: number }

export type PasteRequest = { body: Record<string, unknown>; path: string }

export type PasteTarget =
  | { activityId: number; blockId: string; kind: 'activityBlock'; organisationId: number }
  | { activityId: number; kind: 'activity'; organisationId: number }
  | { kind: 'landscape'; organisationId: number }

/** The level each kind pastes into. */
const PASTE_LEVEL: Record<ClipboardItem['kind'], PasteTarget['kind']> = {
  activity: 'landscape',
  activityBlock: 'activity',
  'task-flows': 'activityBlock',
  'task-lists': 'activityBlock',
}

export const canPaste = (item: ClipboardItem | null, target: PasteTarget): boolean =>
  item !== null && PASTE_LEVEL[item.kind] === target.kind

/**
 * The API call of one paste, or null when the item does not paste into this target. Inside one
 * park the paste links the existing tasks and documents. Across parks it copies them.
 */
export const pasteRequest = (
  item: ClipboardItem,
  target: PasteTarget,
  locale: string,
): null | PasteRequest => {
  if (!canPaste(item, target)) {
    return null
  }

  const samePark = item.organisationId === target.organisationId
  const mode = samePark ? 'link' : 'copy'

  if (item.kind === 'activity' && target.kind === 'landscape') {
    return {
      body: { ids: [item.id], locale, mode, targetOrganisationId: target.organisationId },
      path: '/api/activities/clone',
    }
  }

  if (item.kind === 'activityBlock' && target.kind === 'activity') {
    return {
      body: {
        locale,
        mode,
        source: { activityId: item.activityId, blockId: item.blockId },
        targetActivityId: target.activityId,
      },
      path: '/api/activities/paste-block',
    }
  }

  if ((item.kind === 'task-flows' || item.kind === 'task-lists') && target.kind === 'activityBlock') {
    // Inside one park nothing is copied. The existing task gets linked to the Prozessgruppe.
    if (samePark) {
      return {
        body: { blockId: target.blockId, collection: item.kind, taskId: item.id },
        path: `/api/activities/${target.activityId}/attach-task`,
      }
    }

    return {
      body: {
        ids: [item.id],
        locale,
        target: { activityId: target.activityId, blockId: target.blockId },
        targetOrganisationId: target.organisationId,
      },
      path: `/api/${item.kind}/clone`,
    }
  }

  return null
}

/** A stored preference is untrusted input. Anything that is not a valid item reads as empty. */
export const parseClipboardItem = (value: unknown): ClipboardItem | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const item = value as Record<string, unknown>
  const isId = (field: unknown) => typeof field === 'number' && Number.isSafeInteger(field) && field > 0

  if (typeof item.label !== 'string' || !isId(item.organisationId)) {
    return null
  }

  if (item.kind === 'activityBlock') {
    return isId(item.activityId) && typeof item.blockId === 'string' && item.blockId !== ''
      ? (item as ClipboardItem)
      : null
  }

  if (['activity', 'task-flows', 'task-lists'].includes(String(item.kind))) {
    return isId(item.id) ? (item as ClipboardItem) : null
  }

  return null
}
