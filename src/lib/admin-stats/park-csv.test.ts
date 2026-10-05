import { describe, expect, it } from 'vitest'

import type { ParkStatsRow } from '@/lib/admin-stats/types'

import { type ParkCsvHeaders, parkStatsToCsv } from '@/lib/admin-stats/park-csv'

const HEADERS: ParkCsvHeaders = {
  activeUsers: 'Aktiv',
  activities: 'Aktivitäten',
  documents: 'Dokumente',
  language: 'Sprache',
  park: 'Park',
  storageBytes: 'Belegt (Bytes)',
  taskFlows: 'Prozesse',
  taskLists: 'Listen',
  users: 'Benutzer',
}

const row = (overrides: Partial<ParkStatsRow>): ParkStatsRow => ({
  activeUsers: 2,
  activities: 3,
  documents: 4,
  id: 1,
  language: 'de',
  name: 'Parc Ela',
  storageBytes: 1_048_576,
  taskFlows: 5,
  taskLists: 6,
  users: 7,
  ...overrides,
})

const linesOf = (csv: string) => csv.replace('﻿', '').split('\r\n')

describe('parkStatsToCsv', () => {
  it('starts with a byte order mark and writes one semicolon row per park', () => {
    const csv = parkStatsToCsv([row({})], HEADERS)

    expect(csv.startsWith('﻿')).toBe(true)
    expect(linesOf(csv)).toEqual([
      'Park;Sprache;Benutzer;Aktiv;Aktivitäten;Prozesse;Listen;Dokumente;Belegt (Bytes)',
      'Parc Ela;de;7;2;3;5;6;4;1048576',
      '',
    ])
  })

  it('quotes a name that holds a separator or a quote', () => {
    const csv = parkStatsToCsv([row({ name: 'Park "Nord"; Süd' })], HEADERS)

    expect(linesOf(csv)[1]).toBe('"Park ""Nord""; Süd";de;7;2;3;5;6;4;1048576')
  })

  it('defuses a name that starts like a formula', () => {
    const csv = parkStatsToCsv([row({ name: '=HYPERLINK("x")' })], HEADERS)

    expect(linesOf(csv)[1].startsWith(`"'=HYPERLINK(""x"")"`)).toBe(true)
  })

  it('writes the header row alone for no parks', () => {
    expect(linesOf(parkStatsToCsv([], HEADERS))).toHaveLength(2)
  })
})
