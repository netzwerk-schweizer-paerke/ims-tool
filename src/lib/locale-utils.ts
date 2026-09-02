import { isArray, isObject, isString } from 'es-toolkit/compat'
import { ClientConfig, Locale, SanitizedConfig, TypedLocale } from 'payload'

type Configs = ClientConfig | SanitizedConfig

/**
 * A config that carries a usable localization block. `hasLocalization` narrows to this.
 * The `locales` entries match Payload's own `Locale`, so `getTranslation` accepts a label.
 */
type LocalizedConfig = Configs & {
  localization: {
    defaultLocale: string
    locales: Locale[]
  }
}

/**
 * The content default locale, narrowed to the generated locale union. Returns undefined when
 * the configured default is not a content locale, and a caller then lets Payload pick.
 */
export function getContentDefaultLocale(config: Configs): TypedLocale | undefined {
  return toContentLocale(getDefaultLocaleCode(config), config)
}

export function getDefaultLocaleCode(config: Configs): string {
  if (hasLocalization(config)) {
    return config.localization.defaultLocale
  }

  return 'en'
}

/**
 * Extract locale codes from Payload configuration
 * @param config - Payload configuration object
 * @returns Array of locale codes, defaults to ['en'] if no localization configured
 */
export function getLocaleCodes(config: Configs): string[] {
  if (!hasLocalization(config)) {
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

  return codes.length > 0 ? codes : [getDefaultLocaleCode(config)]
}

/**
 * Get locale codes from a Payload request
 * @param req - Payload request object with config
 * @returns Array of locale codes
 */
export function getLocaleCodesFromRequest(req: { payload: { config: Configs } }): string[] {
  return getLocaleCodes(req.payload.config)
}

/**
 * Get the value from a potentially localized field
 * @param field - The field that might be localized
 * @param locales - Array of locale codes to check
 * @param preferredLocale - Optional preferred locale to check first
 * @returns The field value as a string, or empty string if not found
 */
export function getLocalizedValue(
  field: unknown,
  locales: string[],
  preferredLocale?: string,
): string {
  // If it's already a string, return it
  if (typeof field === 'string') {
    return field
  }

  // If it's not an object, return empty string
  if (!isObject(field)) {
    return ''
  }

  const values = field as Record<string, unknown>

  // Check preferred locale first if provided
  if (preferredLocale && isString(values[preferredLocale])) {
    return values[preferredLocale]
  }

  // Check each locale in order
  for (const locale of locales) {
    if (isString(values[locale])) {
      return values[locale]
    }
  }

  // No value found
  return ''
}

/**
 * Check if a configuration has localization enabled, locales defined and a defaultLocale
 * @param config - Payload configuration object
 * @returns True if localization is configured, false otherwise
 */
export function hasLocalization(config: Configs): config is LocalizedConfig {
  return (
    isObject(config.localization) &&
    isArray(config.localization.locales) &&
    config.localization.locales.length > 0 &&
    isString(config.localization.defaultLocale)
  )
}

/**
 * Narrow a locale code to the content locale union that `payload-types.ts` generates.
 * Returns undefined for an admin language such as `en`, which is not a content locale here.
 * A caller then omits the option, and Payload reads the configured default locale.
 */
export function toContentLocale(
  code: null | string | undefined,
  config: Configs,
): TypedLocale | undefined {
  if (!isString(code)) {
    return undefined
  }

  return isContentLocale(code, config) ? code : undefined
}

function isContentLocale(code: string, config: Configs): code is TypedLocale {
  return getLocaleCodes(config).includes(code)
}
