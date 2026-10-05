import { describe, expect, test } from 'vitest'

import {
  canPaste,
  type ClipboardItem,
  parseClipboardItem,
  pasteRequest,
  type PasteTarget,
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

  test('clones a Thema inside its own park as a link', () => {
    expect(pasteRequest(thema, landscape(PARK), 'fr')?.body).toMatchObject({ mode: 'link' })
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

  test('links an existing Prozess inside one park, with no clone', () => {
    expect(pasteRequest(flow, intoBlock(PARK), 'de')).toEqual({
      body: { blockId: 't-de-2', collection: 'task-flows', taskId: 498 },
      path: '/api/activities/177/attach-task',
    })
  })

  test('clones a Prozess into a Prozessgruppe of another park', () => {
    expect(pasteRequest(flow, intoBlock(OTHER), 'de')).toEqual({
      body: {
        ids: [498],
        locale: 'de',
        target: { activityId: 177, blockId: 't-de-2' },
        targetOrganisationId: OTHER,
      },
      path: '/api/task-flows/clone',
    })
  })

  test('answers null for a target on the wrong level', () => {
    expect(pasteRequest(flow, landscape(PARK), 'de')).toBeNull()
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
