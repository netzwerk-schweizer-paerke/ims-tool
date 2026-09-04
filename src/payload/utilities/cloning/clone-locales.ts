import { SanitizedConfig, TypedLocale } from 'payload'

import { getDefaultLocaleCode, getLocaleCodes, toContentLocale } from '@/lib/locale-utils'

/**
 * The locales one clone reads and writes, with the default locale first.
 *
 * A clone copies every locale the source really has. The default locale leads, so a record
 * that carries all of them is created in the same locale every time.
 */
export const getCloneLocales = (config: SanitizedConfig): TypedLocale[] => {
  const codes = getLocaleCodes(config)
    .map((code) => toContentLocale(code, config))
    .filter((code): code is TypedLocale => code !== undefined)

  const defaultLocale = toContentLocale(getDefaultLocaleCode(config), config)

  if (!defaultLocale) {
    return codes
  }

  return [defaultLocale, ...codes.filter((code) => code !== defaultLocale)]
}

/**
 * Reports whether a source read carries content of its own for the locale it was read in.
 *
 * Read the source with `fallbackLocale: false`, or every locale answers with the default
 * locale's text and the clone gets three copies of one translation. `name` is required, so a
 * locale a translator filled in always has one.
 */
export const hasLocaleContent = (source: { name?: null | string }): boolean =>
  typeof source.name === 'string' && source.name.trim().length > 0
