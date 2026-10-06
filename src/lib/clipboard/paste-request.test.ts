import { describe, expect, test } from 'vitest'

import {
  canPaste,
  type ClipboardItem,
  parseClipboardItem,
  pasteRequest,
  type PasteTarget,
  placeTarget,
} from '@/lib/clipboard/paste-request'

const PARK = 6
const OTHER = 19

const thema: ClipboardItem = { id: 124, kind: 'activity', label: 'Gesellschaft', organisationId: PARK }
const block: ClipboardItem = {
  activityId: 124,
  blockId: 'b-de-0',
  kind: 'activityBlock',
  label: '401 Bildung',
  organisationId: PARK,
}
const flow: ClipboardItem = { id: 498, kind: 'task-flows', label: 'Prozess', organisationId: PARK }

const landscape = (organisationId: number): PasteTarget => ({ kind: 'landscape', organisationId })
const intoThema = (organisationId: number): PasteTarget => ({
  activityId: 177,
  kind: 'activity',
  organisationId,
})
const intoBlock = (organisationId: number): PasteTarget => ({
  activityId: 177,
  blockId: 't-de-2',
  kind: 'activityBlock',
  organisationId,
})

describe('canPaste', () => {
  test('allows each kind only one level up', () => {
    expect(canPaste(thema, landscape(PARK))).toBe(true)
    expect(canPaste(block, intoThema(PARK))).toBe(true)
    expect(canPaste(flow, intoBlock(PARK))).toBe(true)
  })

  test('refuses every other level', () => {
    expect(canPaste(thema, intoThema(PARK))).toBe(false)
    expect(canPaste(block, landscape(PARK))).toBe(false)
    expect(canPaste(block, intoBlock(PARK))).toBe(false)
    expect(canPaste(flow, intoThema(PARK))).toBe(false)
  })

  test('refuses an empty clipboard', () => {
    expect(canPaste(null, landscape(PARK))).toBe(false)
  })
})

describe('pasteRequest', () => {
  test('clones a Thema into another park as a copy', () => {
    expect(pasteRequest(thema, landscape(OTHER), 'de')).toEqual({
      body: { ids: [124], locale: 'de', mode: 'copy', targetOrganisationId: OTHER },
      path: '/api/activities/clone',
    })
  })

  // PIMS-83: a paste always clones, also inside one park. It never links the originals.
  test('clones a Thema inside its own park as a copy', () => {
    expect(pasteRequest(thema, landscape(PARK), 'fr')?.body).toMatchObject({ mode: 'copy' })
  })

  test('clones a Prozessgruppe inside its own park as a copy', () => {
    expect(pasteRequest(block, intoThema(PARK), 'de')?.body).toMatchObject({ mode: 'copy' })
  })

  test('pastes a Prozessgruppe into a Thema', () => {
    expect(pasteRequest(block, intoThema(OTHER), 'de')).toEqual({
      body: {
        locale: 'de',
        mode: 'copy',
        source: { activityId: 124, blockId: 'b-de-0' },
        targetActivityId: 177,
      },
      path: '/api/activities/paste-block',
    })
  })

  test.each([PARK, OTHER])('clones a Prozess into a Prozessgruppe of park %i', (park) => {
    expect(pasteRequest(flow, intoBlock(park), 'de')).toEqual({
      body: {
        ids: [498],
        locale: 'de',
        mode: 'copy',
        target: { activityId: 177, blockId: 't-de-2' },
        targetOrganisationId: park,
      },
      path: '/api/task-flows/clone',
    })
  })

  test('answers null for a target on the wrong level', () => {
    expect(pasteRequest(flow, landscape(PARK), 'de')).toBeNull()
  })
})

describe('pasteRequest next to a sibling', () => {
  test('places a Thema before another Thema', () => {
    const target = placeTarget(
      { anchor: { activityId: 40 }, kind: 'landscape', organisationId: OTHER },
      'before',
    )

    expect(pasteRequest(thema, target, 'de')?.body).toMatchObject({
      position: { anchorActivityId: 40, placement: 'before' },
    })
  })

  test('places a Prozessgruppe after another Prozessgruppe by default', () => {
    const target: PasteTarget = {
      activityId: 177,
      anchor: { blockId: 't-de-1' },
      kind: 'activity',
      organisationId: OTHER,
    }

    expect(pasteRequest(block, target, 'de')?.body).toMatchObject({
      position: { anchorBlockId: 't-de-1', placement: 'after' },
    })
  })

  test('places a cloned Prozess next to the anchor task in either park', () => {
    const nextToList = (organisationId: number) =>
      placeTarget(
        {
          activityId: 177,
          anchor: { collection: 'task-lists', id: 7 },
          blockId: 't-de-2',
          kind: 'activityBlock',
          organisationId,
        },
        'before',
      )
    const position = { anchorCollection: 'task-lists', anchorId: 7, placement: 'before' }

    expect(pasteRequest(flow, nextToList(PARK), 'de')?.body).toMatchObject({
      target: { position },
    })
    expect(pasteRequest(flow, nextToList(OTHER), 'de')?.body).toMatchObject({
      target: { position },
    })
  })

  test('sends no position without an anchor', () => {
    expect(pasteRequest(thema, placeTarget(landscape(PARK), 'before'), 'de')?.body).not.toHaveProperty(
      'position',
    )
  })
})

describe('parseClipboardItem', () => {
  test('accepts each valid kind', () => {
    expect(parseClipboardItem(thema)).toEqual(thema)
    expect(parseClipboardItem(block)).toEqual(block)
    expect(parseClipboardItem(flow)).toEqual(flow)
  })

  test('reads anything else as empty', () => {
    expect(parseClipboardItem(null)).toBeNull()
    expect(parseClipboardItem('activity')).toBeNull()
    expect(parseClipboardItem({ ...thema, kind: 'documents' })).toBeNull()
    expect(parseClipboardItem({ ...thema, id: -1 })).toBeNull()
    expect(parseClipboardItem({ ...block, blockId: '' })).toBeNull()
    expect(parseClipboardItem({ ...flow, organisationId: undefined })).toBeNull()
  })
})
