import { Config, SanitizedConfig } from 'payload'
import { isObject } from 'lodash-es'

/**
 * Extract locale codes from Payload configuration
 * @param config - Payload configuration object
 * @returns Array of locale codes, defaults to ['en'] if no localization configured
 */
export function getLocaleCodes(config: SanitizedConfig): string[] {
  if (!config.localization || !config.localization.locales) {
    return ['en']
  }

  const codes = config.localization.locales
    .map((locale) => {
      if (isObject(locale) && 'code' in locale && typeof locale.code === 'string') {
        return locale.code
      }
      return null
    })
    .filter((code): code is string => code !== null)

  return codes.length > 0 ? codes : ['en']
}

/**
 * Get locale codes from a Payload request
 * @param req - Payload request object with config
 * @returns Array of locale codes
 */
export function getLocaleCodesFromRequest(
  req: { payload: { config: SanitizedConfig } } | { payload: any },
): string[] {
  return getLocaleCodes(req.payload.config)
}

/**
 * Get the value from a potentially localized field
 * @param field - The field that might be localized
 * @param locales - Array of locale codes to check
 * @param preferredLocale - Optional preferred locale to check first
 * @returns The field value as a string, or empty string if not found
 */
export function getLocalizedValue(field: any, locales: string[], preferredLocale?: string): string {
  // If it's already a string, return it
  if (typeof field === 'string') {
    return field
  }

  // If it's not an object, return empty string
  if (typeof field !== 'object' || field === null) {
    return ''
  }

  // Check preferred locale first if provided
  if (preferredLocale && field[preferredLocale]) {
    return field[preferredLocale]
  }

  // Check each locale in order
  for (const locale of locales) {
    if (field[locale]) {
      return field[locale]
    }
  }

  // No value found
  return ''
}

/**
 * Check if a configuration has localization enabled
 * @param config - Payload configuration object
 * @returns True if localization is configured, false otherwise
 */
export function hasLocalization(config: Config): boolean {
  return !!(
    config.localization &&
    config.localization.locales &&
    config.localization.locales.length > 0
  )
}
