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

/**
 * Where a paste lands. Without an anchor the item goes to the end of the level. With an anchor
 * it goes directly before or after that sibling. The menu sets `placement` per entry.
 */
export type PasteTarget =
  | {
      activityId: number
      anchor?: { blockId: string; placement?: Placement }
      kind: 'activity'
      organisationId: number
    }
  | {
      activityId: number
      anchor?: { collection: 'task-flows' | 'task-lists'; id: number; placement?: Placement }
      blockId: string
      kind: 'activityBlock'
      organisationId: number
    }
  | { anchor?: { activityId: number; placement?: Placement }; kind: 'landscape'; organisationId: number }

/** Where a pasted item lands next to a sibling of its own level ("Davor" / "Danach"). */
export type Placement = 'after' | 'before'

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
 * The API call of one paste, or null when the item does not paste into this target. Every paste
 * clones the item with its tasks and documents, also inside one park.
 */
export const pasteRequest = (
  item: ClipboardItem,
  target: PasteTarget,
  locale: string,
): null | PasteRequest => {
  if (!canPaste(item, target)) {
    return null
  }

  const placement = target.anchor?.placement ?? 'after'

  if (item.kind === 'activity' && target.kind === 'landscape') {
    return {
      body: {
        ids: [item.id],
        locale,
        targetOrganisationId: target.organisationId,
        ...(target.anchor && {
          position: { anchorActivityId: target.anchor.activityId, placement },
        }),
      },
      path: '/api/activities/clone',
    }
  }

  if (item.kind === 'activityBlock' && target.kind === 'activity') {
    return {
      body: {
        locale,
        source: { activityId: item.activityId, blockId: item.blockId },
        targetActivityId: target.activityId,
        ...(target.anchor && { position: { anchorBlockId: target.anchor.blockId, placement } }),
      },
      path: '/api/activities/paste-block',
    }
  }

  if ((item.kind === 'task-flows' || item.kind === 'task-lists') && target.kind === 'activityBlock') {
    const position = target.anchor && {
      anchorCollection: target.anchor.collection,
      anchorId: target.anchor.id,
      placement,
    }

    return {
      body: {
        ids: [item.id],
        locale,
        target: {
          activityId: target.activityId,
          blockId: target.blockId,
          ...(position && { position }),
        },
        targetOrganisationId: target.organisationId,
      },
      path: `/api/${item.kind}/clone`,
    }
  }

  return null
}

/** The same target with the anchor placed before or after. A target with no anchor stays as it is. */
export const placeTarget = (target: PasteTarget, placement: Placement): PasteTarget =>
  target.anchor ? ({ ...target, anchor: { ...target.anchor, placement } } as PasteTarget) : target

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
