import type { CollectionBeforeChangeHook, GlobalBeforeChangeHook } from 'payload'
import type { TranslationMeta } from '../fields/translation-meta-field'
import { getDefaultLocaleCode } from '@/lib/locale-utils'

/**
 * Check if any localized fields have changed
 */
function checkForLocalizedFieldChanges(
  newData: Record<string, any>,
  originalData: Record<string, any>,
  locale: string,
): boolean {
  // When updating via API with locale parameter, the update data contains
  // the field values directly (e.g., { name: "New Name" })
  // We need to compare with the original localized values

  console.log('[Translation Tracking] Checking changes for locale:', locale)
  console.log('[Translation Tracking] New data keys:', Object.keys(newData))

  // Check each field in the update data
  for (const fieldName in newData) {
    // Skip the metadata field itself
    if (fieldName === 'translationMeta') continue

    const newValue = newData[fieldName]

    // For localized fields, the original data might have them stored with locale suffix
    // or in the field directly depending on the locale context
    let originalValue = originalData[fieldName]

    // Also check for locale-suffixed version
    if (originalData[`${fieldName}.${locale}`] !== undefined) {
      originalValue = originalData[`${fieldName}.${locale}`]
    }

    // Also check if the field itself is an object with locale keys
    if (originalValue && typeof originalValue === 'object' && locale in originalValue) {
      originalValue = originalValue[locale]
    }

    console.log(`[Translation Tracking] Comparing field ${fieldName}:`, {
      original: originalValue,
      new: newValue,
    })

    // Compare values
    if (JSON.stringify(originalValue) !== JSON.stringify(newValue)) {
      console.log(`[Translation Tracking] Field ${fieldName} has changed`)
      return true
    }
  }

  return false
}

/**
 * Check if a locale has any content (has been saved before)
 */
function hasLocaleContent(data: Record<string, any>, locale: string): boolean {
  // Check if any localized field has content for this locale
  for (const key in data) {
    if (key.endsWith(`.${locale}`) || key === locale) {
      const value = data[key]
      // Check if the value is not null, undefined, or empty string
      if (value !== null && value !== undefined && value !== '') {
        return true
      }
    }
  }
  return false
}

/**
 * Hook to track when content changes and mark dependent translations as outdated (for collections)
 */
export const createTrackTranslationChangesHookForCollection = (
  metaFieldName: string,
): CollectionBeforeChangeHook => {
  return async ({ data, req, originalDoc, operation }) => {
    // Only track on updates, not creates
    if (operation !== 'update' || !originalDoc) {
      return data
    }

    const locale = req.locale || getDefaultLocaleCode(req.payload.config)
    if (!locale) return data

    const now = new Date().toISOString()

    // Get existing metadata from the original document (not from the update data)
    // This ensures we're working with the current state
    let translationMeta: TranslationMeta = originalDoc[metaFieldName] || {
      lastModified: {},
      translations: {},
    }

    // Create a deep copy to avoid mutating the original
    translationMeta = JSON.parse(JSON.stringify(translationMeta))

    // Ensure structure exists
    if (!translationMeta.lastModified) {
      translationMeta.lastModified = {}
    }
    if (!translationMeta.translations) {
      translationMeta.translations = {}
    }

    // Check if any localized fields have changed
    const hasLocalizedChanges = checkForLocalizedFieldChanges(data, originalDoc, locale)

    if (hasLocalizedChanges) {
      // Update last modified for current locale
      translationMeta.lastModified[locale] = now

      // Mark any translations that were derived from this locale as outdated
      Object.keys(translationMeta.translations).forEach((targetLocale) => {
        const translation = translationMeta.translations![targetLocale]
        if (translation.from === locale) {
          // This translation was derived from the locale that just changed
          translation.isOutdated = true
        }
      })
    }

    return {
      ...data,
      [metaFieldName]: translationMeta,
    }
  }
}

/**
 * Hook to track when content changes and mark dependent translations as outdated (for globals)
 */
export const createTrackTranslationChangesHookForGlobal = (
  metaFieldName: string,
): GlobalBeforeChangeHook => {
  return async ({ data, req, originalDoc }) => {
    // For globals, there's no operation parameter
    if (!originalDoc) {
      return data
    }

    const locale = req.locale || getDefaultLocaleCode(req.payload.config)
    if (!locale) return data

    const now = new Date().toISOString()

    // Get existing metadata from the original document (not from the update data)
    // This ensures we're working with the current state
    let translationMeta: TranslationMeta = originalDoc[metaFieldName] || {
      lastModified: {},
      translations: {},
    }

    // Create a deep copy to avoid mutating the original
    translationMeta = JSON.parse(JSON.stringify(translationMeta))

    // Ensure structure exists
    if (!translationMeta.lastModified) {
      translationMeta.lastModified = {}
    }
    if (!translationMeta.translations) {
      translationMeta.translations = {}
    }

    // Check if any localized fields have changed
    const hasLocalizedChanges = checkForLocalizedFieldChanges(data, originalDoc, locale)

    if (hasLocalizedChanges) {
      // Update last modified for current locale
      translationMeta.lastModified[locale] = now

      // Mark any translations that were derived from this locale as outdated
      Object.keys(translationMeta.translations).forEach((targetLocale) => {
        const translation = translationMeta.translations![targetLocale]
        if (translation.from === locale) {
          // This translation was derived from the locale that just changed
          translation.isOutdated = true
        }
      })
    }

    return {
      ...data,
      [metaFieldName]: translationMeta,
    }
  }
}

/**
 * Hook to update translation metadata after translation (for collections)
 */
export const createClearOutdatedHookForCollection = (
  metaFieldName: string,
): CollectionBeforeChangeHook => {
  return async ({ data, req, context }) => {
    // Check if this update is from a translation operation
    if (context?.isTranslation) {
      const locale = req.locale
      const fromLocale = context?.fromLocale

      if (locale && fromLocale) {
        // Get the metadata from the original doc or the data being saved
        const bodyData =
          req.body && typeof req.body === 'object' && !(req.body instanceof ReadableStream)
            ? (req.body as Record<string, any>)
            : {}
        const existingMeta = data[metaFieldName] || bodyData[metaFieldName] || {}
        const translationMeta: TranslationMeta = JSON.parse(JSON.stringify(existingMeta))

        // Ensure structure exists
        if (!translationMeta.translations) {
          translationMeta.translations = {}
        }

        // Update translation relationship
        translationMeta.translations[locale] = {
          from: fromLocale as string,
          date: new Date().toISOString(),
          isOutdated: false, // Mark as up-to-date since we just translated
        }

        // Update last modified for this locale
        translationMeta.lastModified[locale] = new Date().toISOString()

        return {
          ...data,
          [metaFieldName]: translationMeta,
        }
      }
    }

    return data
  }
}

/**
 * Hook to update translation metadata after translation (for globals)
 */
export const createClearOutdatedHookForGlobal = (metaFieldName: string): GlobalBeforeChangeHook => {
  return async ({ data, req, context }) => {
    // Check if this update is from a translation operation
    if (context?.isTranslation) {
      const locale = req.locale
      const fromLocale = context?.fromLocale

      if (locale && fromLocale) {
        // Get the metadata from the original doc or the data being saved
        const bodyData =
          req.body && typeof req.body === 'object' && !(req.body instanceof ReadableStream)
            ? (req.body as Record<string, any>)
            : {}
        const existingMeta = data[metaFieldName] || bodyData[metaFieldName] || {}
        const translationMeta: TranslationMeta = JSON.parse(JSON.stringify(existingMeta))

        // Ensure structure exists
        if (!translationMeta.translations) {
          translationMeta.translations = {}
        }

        // Update translation relationship
        translationMeta.translations[locale] = {
          from: fromLocale as string,
          date: new Date().toISOString(),
          isOutdated: false, // Mark as up-to-date since we just translated
        }

        // Update last modified for this locale
        translationMeta.lastModified[locale] = new Date().toISOString()

        return {
          ...data,
          [metaFieldName]: translationMeta,
        }
      }
    }

    return data
  }
}
