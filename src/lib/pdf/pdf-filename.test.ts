import { describe, expect, test } from 'vitest'

import { clampSegment, pdfFilename, slugify } from './pdf-filename'

const PRODUCED_AT = new Date('2026-09-04T14:22:00.000Z')

const NAME = { deepLabel: 'komplett', organisationName: 'Backup Musterpark', producedAt: PRODUCED_AT }

describe('slugify', () => {
  test('folds the accents the three content languages use', () => {
    expect(slugify('Zürich')).toBe('zuerich')
    expect(slugify('Forêt à Genève')).toBe('foret-a-geneve')
    expect(slugify('Straße')).toBe('strasse')
  })

  test('joins every run of other characters into one hyphen', () => {
    expect(slugify('301.01 — Strategie & Führung')).toBe('301-01-strategie-fuehrung')
  })

  test('trims the leading and trailing hyphens a punctuated name leaves', () => {
    expect(slugify('«Naturpark»')).toBe('naturpark')
    expect(slugify('...')).toBe('')
  })
})

describe('clampSegment', () => {
  test('leaves a segment inside the cap alone', () => {
    expect(clampSegment('kurz-und-buendig')).toBe('kurz-und-buendig')
  })

  test('cuts at the last whole word inside the cap', () => {
    expect(clampSegment('eins-zwei-drei-vier', 12)).toBe('eins-zwei')
  })

  test('cuts mid-word rather than lose most of a long first word', () => {
    expect(clampSegment('donaudampfschifffahrtsgesellschaft', 10)).toBe('donaudampf')
  })
})

describe('pdfFilename', () => {
  test('names the park, the page and the date', () => {
    expect(pdfFilename({ ...NAME, deep: false, title: 'Prozesslandkarte' })).toBe(
      'backup-musterpark_prozesslandkarte_2026-09-04.pdf',
    )
  })

  test('marks a deep export in the document language', () => {
    expect(pdfFilename({ ...NAME, deep: true, title: 'Prozesslandkarte' })).toBe(
      'backup-musterpark_prozesslandkarte_komplett_2026-09-04.pdf',
    )

    expect(
      pdfFilename({ ...NAME, deep: true, deepLabel: 'complet', title: "Paysage d'activités" }),
    ).toBe('backup-musterpark_paysage-d-activites_complet_2026-09-04.pdf')
  })

  test('never repeats the park name as the page name', () => {
    expect(pdfFilename({ ...NAME, deep: false, title: 'Backup Musterpark' })).toBe(
      'backup-musterpark_2026-09-04.pdf',
    )
  })

  test('caps a long page name, so a file dialog can show the whole name', () => {
    const name = pdfFilename({
      ...NAME,
      deep: false,
      title: 'Bündeln bestehender und neuer Angebote von Leistungsträgern im ganzen Park',
    })

    expect(name.length).toBeLessThanOrEqual(80)
    expect(name).toContain('buendeln-bestehender')
  })

  test('drops a segment that folds away, rather than leave an empty one', () => {
    expect(
      pdfFilename({ ...NAME, deep: false, organisationName: '', title: '...' }),
    ).toBe('2026-09-04.pdf')
  })
})
