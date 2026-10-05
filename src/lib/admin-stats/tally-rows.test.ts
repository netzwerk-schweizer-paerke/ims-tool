import { describe, expect, it } from 'vitest'

import {
  countByOrganisation,
  countNamedPerLocale,
  tallyClones,
  tallyUsers,
} from '@/lib/admin-stats/tally-rows'

const SINCE = new Date('2026-09-05T00:00:00.000Z')

describe('tallyUsers activity', () => {
  it('counts a login at or after the cut-off as active in every park of the user', () => {
    const { activeByPark, byPark } = tallyUsers(
      [
        { lastLoginAt: '2026-09-05T00:00:00.000Z', organisations: [{ organisation: 1 }] },
        { lastLoginAt: '2026-10-01T08:00:00.000Z', organisations: [{ organisation: 1 }, { organisation: 2 }] },
        { lastLoginAt: '2026-09-04T23:59:59.999Z', organisations: [{ organisation: 1 }] },
      ],
      'admin',
      SINCE,
    )

    expect(byPark.get(1)).toBe(3)
    expect(activeByPark.get(1)).toBe(2)
    expect(activeByPark.get(2)).toBe(1)
  })

  it('counts a user who never logged in, or carries an invalid date, as inactive', () => {
    const { activeByPark } = tallyUsers(
      [
        { organisations: [{ organisation: 1 }] },
        { lastLoginAt: null, organisations: [{ organisation: 1 }] },
        { lastLoginAt: 'not a date', organisations: [{ organisation: 1 }] },
      ],
      'admin',
      SINCE,
    )

    expect(activeByPark.get(1)).toBeUndefined()
  })
})

describe('tallyClones', () => {
  it('counts each collection per source and target park', () => {
    const pairs = tallyClones({
      activities: [
        { clonedFromOrganisation: 17, organisation: 6 },
        { clonedFromOrganisation: { id: 17 }, organisation: { id: 6 } },
      ],
      taskFlows: [{ clonedFromOrganisation: 17, organisation: 6 }],
      taskLists: [{ clonedFromOrganisation: 17, organisation: 9 }],
    })

    expect(pairs).toEqual([
      { activities: 2, source: 17, target: 6, taskFlows: 1, taskLists: 0 },
      { activities: 0, source: 17, target: 9, taskFlows: 0, taskLists: 1 },
    ])
  })

  it('skips a row with no source park or no target park', () => {
    const pairs = tallyClones({
      activities: [{ organisation: 6 }, { clonedFromOrganisation: null, organisation: 6 }],
      taskFlows: [{ clonedFromOrganisation: 17 }],
      taskLists: [],
    })

    expect(pairs).toEqual([])
  })
})

describe('countByOrganisation', () => {
  it('counts a bare id and a populated relation as the same park', () => {
    const { byPark } = countByOrganisation([
      { organisation: 11 },
      { organisation: { id: 11, name: 'Park' } },
    ])

    expect(byPark.get(11)).toEqual({ bytes: 0, count: 2 })
  })

  it('sums filesize per park and ignores a missing or invalid one', () => {
    const { byPark } = countByOrganisation([
      { filesize: 400, organisation: 7 },
      { filesize: null, organisation: 7 },
      { filesize: NaN, organisation: 7 },
      { filesize: -20, organisation: 7 },
    ])

    expect(byPark.get(7)).toEqual({ bytes: 400, count: 4 })
  })

  it('puts a row with no organisation into unassigned', () => {
    const { byPark, unassigned } = countByOrganisation([
      { filesize: 90 },
      { organisation: null },
      { organisation: 3 },
    ])

    expect(unassigned).toEqual({ bytes: 90, count: 2 })
    expect(byPark.size).toBe(1)
  })

  it('returns empty tallies for no rows', () => {
    const { byPark, unassigned } = countByOrganisation([])

    expect(byPark.size).toBe(0)
    expect(unassigned).toEqual({ bytes: 0, count: 0 })
  })
})

describe('countNamedPerLocale', () => {
  it('counts a locale only when it holds text', () => {
    const named = countNamedPerLocale(
      [
        { name: { de: 'Eins', fr: 'Un', it: null } },
        { name: { de: 'Zwei', fr: ' '.repeat(3), it: '' } },
      ],
      ['de', 'fr', 'it'],
    )

    expect(named.get('de')).toBe(2)
    expect(named.get('fr')).toBe(1)
    expect(named.get('it')).toBe(0)
  })

  it('counts no locale when the name is not a locale record', () => {
    const named = countNamedPerLocale([{ name: 'plain' }, { name: undefined }], ['de'])

    expect(named.get('de')).toBe(0)
  })

  it('reports every requested locale even with no rows', () => {
    const named = countNamedPerLocale([], ['de', 'fr'])

    expect(named.entries().toArray()).toEqual([
      ['de', 0],
      ['fr', 0],
    ])
  })
})

describe('tallyUsers', () => {
  it('counts a user in every park they belong to', () => {
    const { byPark, total } = tallyUsers(
      [{ organisations: [{ organisation: 1 }, { organisation: 2 }] }, { organisations: [{ organisation: 2 }] }],
      'admin',
      SINCE,
    )

    expect(byPark.get(1)).toBe(1)
    expect(byPark.get(2)).toBe(2)
    expect(total).toBe(2)
  })

  it('counts a duplicated membership once', () => {
    const { byPark } = tallyUsers(
      [{ organisations: [{ organisation: 4 }, { organisation: { id: 4 } }] }],
      'admin',
      SINCE,
    )

    expect(byPark.get(4)).toBe(1)
  })

  it('counts a user with no membership as noPark', () => {
    const { noPark } = tallyUsers([{ organisations: [] }, { organisations: null }, {}], 'admin', SINCE)

    expect(noPark).toBe(3)
  })

  it('counts the super admins by role', () => {
    const { superAdmins } = tallyUsers(
      [{ roles: ['admin'] }, { roles: ['user'] }, { roles: null }],
      'admin',
      SINCE,
    )

    expect(superAdmins).toBe(1)
  })
})
