import { describe, expect, test } from 'vitest'

import { buildShareUrl, shareTargetFromLink, shareTargetWhere } from './share-link-target'

describe('buildShareUrl', () => {
  test('appends the locale when one is given', () => {
    expect(buildShareUrl({ locale: 'fr', origin: 'https://ims.example', token: 'abc123' })).toBe(
      'https://ims.example/share/abc123?locale=fr',
    )
  })

  test('omits the query when no locale is given', () => {
    expect(buildShareUrl({ origin: 'https://ims.example', token: 'abc123' })).toBe(
      'https://ims.example/share/abc123',
    )
  })

  test('drops a trailing slash on the origin', () => {
    expect(buildShareUrl({ origin: 'https://ims.example/', token: 'abc123' })).toBe(
      'https://ims.example/share/abc123',
    )
  })

  test('escapes a token that carries a URL character', () => {
    // base64url never emits one, so this only proves the builder cannot produce a broken path.
    expect(buildShareUrl({ origin: 'https://ims.example', token: 'a/b?c' })).toBe(
      'https://ims.example/share/a%2Fb%3Fc',
    )
  })
})

describe('shareTargetFromLink', () => {
  test('reads an activity block from populated relations', () => {
    expect(
      shareTargetFromLink({
        activity: { id: 12 },
        blockId: 'block-1',
        targetType: 'activityBlock',
      }),
    ).toEqual({ activity: 12, blockId: 'block-1', targetType: 'activityBlock' })
  })

  test('reads a flow from a bare relation id', () => {
    expect(shareTargetFromLink({ targetType: 'flow', taskFlow: 42 })).toEqual({
      targetType: 'flow',
      taskFlow: 42,
    })
  })

  test('reads a list from a bare relation id', () => {
    expect(shareTargetFromLink({ targetType: 'list', taskList: 7 })).toEqual({
      targetType: 'list',
      taskList: 7,
    })
  })

  test('reads the landscape, which carries no id', () => {
    expect(shareTargetFromLink({ targetType: 'activityLandscape' })).toEqual({
      targetType: 'activityLandscape',
    })
  })

  test('returns null when an activity block has no block id', () => {
    expect(shareTargetFromLink({ activity: 12, targetType: 'activityBlock' })).toBeNull()
  })

  test('returns null when an activity block has no activity', () => {
    expect(shareTargetFromLink({ blockId: 'block-1', targetType: 'activityBlock' })).toBeNull()
  })

  test('returns null when a flow row lost its relation', () => {
    expect(shareTargetFromLink({ targetType: 'flow' })).toBeNull()
  })

  test('returns null for an unknown target type', () => {
    expect(shareTargetFromLink({ targetType: 'somethingElse' })).toBeNull()
  })
})

describe('shareTargetWhere', () => {
  test('matches an activity block by activity and block id', () => {
    expect(
      shareTargetWhere({ activity: 12, blockId: 'block-1', targetType: 'activityBlock' }),
    ).toEqual({
      and: [
        { targetType: { equals: 'activityBlock' } },
        { activity: { equals: 12 } },
        { blockId: { equals: 'block-1' } },
      ],
    })
  })

  test('matches a flow by its id', () => {
    expect(shareTargetWhere({ targetType: 'flow', taskFlow: 42 })).toEqual({
      and: [{ targetType: { equals: 'flow' } }, { taskFlow: { equals: 42 } }],
    })
  })

  test('matches a list by its id', () => {
    expect(shareTargetWhere({ targetType: 'list', taskList: 7 })).toEqual({
      and: [{ targetType: { equals: 'list' } }, { taskList: { equals: 7 } }],
    })
  })

  test('matches the landscape on the target type alone', () => {
    expect(shareTargetWhere({ targetType: 'activityLandscape' })).toEqual({
      targetType: { equals: 'activityLandscape' },
    })
  })
})
