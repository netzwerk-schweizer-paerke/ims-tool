import { SanitizedConfig } from 'payload'
import { describe, expect, test } from 'vitest'

import { toParkLocale } from './locale-utils'

/**
 * `hasLocalization` reads three keys of the config. A whole SanitizedConfig needs hundreds of
 * fields no locale helper touches, so the fixture carries the three and takes one cast.
 */
const configWithLocales = {
  localization: {
    defaultLocale: 'de',
    locales: [{ code: 'de' }, { code: 'fr' }, { code: 'it' }],
  },
} as unknown as SanitizedConfig

const configWithoutLocalization = {} as unknown as SanitizedConfig

describe('toParkLocale', () => {
  test.each(['it', 'fr', 'de'])('keeps the content locale %s', (language) => {
    expect(toParkLocale(language, configWithLocales)).toBe(language)
  })

  test('answers the default locale for en, which is an admin language only', () => {
    expect(toParkLocale('en', configWithLocales)).toBe('de')
  })

  test('answers the default locale for a park created before the field existed', () => {
    expect(toParkLocale(null, configWithLocales)).toBe('de')
    expect(toParkLocale(undefined, configWithLocales)).toBe('de')
  })

  test('answers the default locale for a code the config does not declare', () => {
    expect(toParkLocale('rm', configWithLocales)).toBe('de')
  })

  // `getDefaultLocaleCode` answers 'en' with no localization block. This project always
  // configures one, so no park reaches this branch. The case pins the contract.
  test('answers en when the config declares no localization', () => {
    expect(toParkLocale('it', configWithoutLocalization)).toBe('en')
  })
})
