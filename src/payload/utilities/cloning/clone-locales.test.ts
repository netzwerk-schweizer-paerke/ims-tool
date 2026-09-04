import { SanitizedConfig } from 'payload'
import { describe, expect, test } from 'vitest'

import { getCloneLocales, hasLocaleContent } from './clone-locales'

/** `getLocaleCodes` reads two keys only, so a fixture needs no full sanitized config. */
const configWith = (defaultLocale: string, codes: string[]) =>
  ({
    localization: {
      defaultLocale,
      locales: codes.map((code) => ({ code })),
    },
  }) as SanitizedConfig

describe('getCloneLocales', () => {
  test('puts the default locale first and keeps the config order after it', () => {
    expect(getCloneLocales(configWith('de', ['de', 'fr', 'it']))).toEqual(['de', 'fr', 'it'])
  })

  test('moves the default locale to the front when the config lists it later', () => {
    expect(getCloneLocales(configWith('it', ['de', 'fr', 'it']))).toEqual(['it', 'de', 'fr'])
  })

  test('names every locale exactly once', () => {
    const locales = getCloneLocales(configWith('de', ['de', 'fr', 'it']))

    expect(new Set(locales).size).toBe(locales.length)
  })

  // A default the locale list does not contain is not a content locale, so it cannot lead.
  test('returns the configured locales when the default is not one of them', () => {
    expect(getCloneLocales(configWith('en', ['de', 'fr']))).toEqual(['de', 'fr'])
  })

  test('returns one locale for a config that has no localization', () => {
    expect(getCloneLocales({} as SanitizedConfig)).toHaveLength(1)
  })
})

describe('hasLocaleContent', () => {
  test('accepts a name the locale really carries', () => {
    expect(hasLocaleContent({ name: '701_01 Personalgewinnung' })).toBe(true)
  })

  // A read with `fallbackLocale: false` leaves `name` absent for an untranslated locale.
  test('rejects an absent, empty or blank name', () => {
    expect(hasLocaleContent({})).toBe(false)
    expect(hasLocaleContent({ name: null })).toBe(false)
    expect(hasLocaleContent({ name: '' })).toBe(false)
    expect(hasLocaleContent({ name: ' '.repeat(3) })).toBe(false)
  })
})
