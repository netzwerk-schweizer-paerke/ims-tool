import { describe, expect, test } from 'vitest'

import { foldSearchText, plainSearchText } from '@/lib/search/fold-search-text'

describe('plainSearchText', () => {
  test('lowercases and removes every accent', () => {
    expect(plainSearchText('Évaluation Générale')).toBe('evaluation generale')
    expect(plainSearchText('Città Attività')).toBe('citta attivita')
  })

  test('keeps the length of the source, so an offset stays valid', () => {
    const source = 'Réunion de planification'

    expect(plainSearchText(source)).toHaveLength(source.length)
  })

  test('answers an empty string for a value that is no string', () => {
    expect(plainSearchText(undefined)).toBe('')
    expect(plainSearchText(null)).toBe('')
    expect(plainSearchText(7)).toBe('')
  })
})

describe('foldSearchText', () => {
  test('folds an umlaut and its transliteration to one form', () => {
    expect(foldSearchText('Stolperunfälle')).toBe(foldSearchText('Stolperunfaelle'))
    expect(foldSearchText('Übersicht')).toBe(foldSearchText('Uebersicht'))
    expect(foldSearchText('Pärke')).toBe(foldSearchText('Paerke'))
    expect(foldSearchText('Musikhören')).toBe(foldSearchText('Musikhoeren'))
  })

  test('folds the sharp s to the same form as its transliteration', () => {
    expect(foldSearchText('Straße')).toBe(foldSearchText('Strasse'))
  })

  test('folds a word without an umlaut to the same form as the accent fold', () => {
    expect(foldSearchText('Anmeldung')).toBe('anmeldung')
    expect(foldSearchText('Évaluation')).toBe('evaluation')
  })

  // A fold that mapped `ue` to `u` would join the two parts of a compound and lose the match.
  test.each([
    ['Bauelement', 'Element'],
    ['Büroeinrichtung', 'Einrichtung'],
    ['Neueintritt', 'Eintritt'],
    ['Neuentwicklung', 'Entwicklung'],
    ['Videoeinsatz', 'Einsatz'],
    ['Quelle', 'elle'],
    ['zuerst', 'erst'],
  ])('keeps the word boundary of the compound %s, which holds %s', (text, word) => {
    expect(foldSearchText(text)).toContain(foldSearchText(word))
  })

  test('never loses a match the plain lower case comparison found', () => {
    const pairs = [
      ['Stolperunfaelle', 'unfaelle'],
      ['Musikhören', 'hören'],
      ['Straße', 'straße'],
      ['Übersicht Datenbanken', 'datenbanken'],
    ]

    for (const [text, word] of pairs) {
      expect(text.toLowerCase()).toContain(word.toLowerCase())
      expect(foldSearchText(text)).toContain(foldSearchText(word))
    }
  })

  test('answers an empty string for a value that is no string', () => {
    expect(foldSearchText(undefined)).toBe('')
  })
})
