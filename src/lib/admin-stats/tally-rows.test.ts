import { describe, expect, it } from 'vitest'

import { countByOrganisation, countNamedPerLocale, tallyUsers } from '@/lib/admin-stats/tally-rows'

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
    )

    expect(byPark.get(1)).toBe(1)
    expect(byPark.get(2)).toBe(2)
    expect(total).toBe(2)
  })

  it('counts a duplicated membership once', () => {
    const { byPark } = tallyUsers(
      [{ organisations: [{ organisation: 4 }, { organisation: { id: 4 } }] }],
      'admin',
    )

    expect(byPark.get(4)).toBe(1)
  })

  it('counts a user with no membership as noPark', () => {
    const { noPark } = tallyUsers([{ organisations: [] }, { organisations: null }, {}], 'admin')

    expect(noPark).toBe(3)
  })

  it('counts the super admins by role', () => {
    const { superAdmins } = tallyUsers(
      [{ roles: ['admin'] }, { roles: ['user'] }, { roles: null }],
      'admin',
    )

    expect(superAdmins).toBe(1)
  })
})
