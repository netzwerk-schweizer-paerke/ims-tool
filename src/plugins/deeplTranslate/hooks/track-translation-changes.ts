import type { CollectionBeforeChangeHook, GlobalBeforeChangeHook } from 'payload'

import { getDefaultLocaleCode } from '@/lib/locale-utils'

import type { TranslationMeta } from '../fields/translation-meta-field'

/** Narrows an unknown value so the code can read a property off it. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * Check if any localized fields have changed
 */
function checkForLocalizedFieldChanges(
  newData: Record<string, unknown>,
  originalData: Record<string, unknown>,
  locale: string,
): boolean {
  // When updating via API with locale parameter, the update data contains
  // the field values directly (e.g., { name: "New Name" })
  // We need to compare with the original localized values

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
    if (isRecord(originalValue) && locale in originalValue) {
      originalValue = originalValue[locale]
    }

    // Compare values
    if (JSON.stringify(originalValue) !== JSON.stringify(newValue)) {
      return true
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
  return async ({ data, operation, originalDoc, req }) => {
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
    translationMeta = structuredClone(translationMeta)

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
      for (const translation of Object.values(translationMeta.translations)) {
        if (translation.from === locale) {
          // This translation was derived from the locale that just changed
          translation.isOutdated = true
        }
      }
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
  return async ({ data, originalDoc, req }) => {
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
    translationMeta = structuredClone(translationMeta)

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
      for (const translation of Object.values(translationMeta.translations)) {
        if (translation.from === locale) {
          // This translation was derived from the locale that just changed
          translation.isOutdated = true
        }
      }
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
  return async ({ context, data, req }) => {
    // Check if this update is from a translation operation
    if (context?.isTranslation) {
      const locale = req.locale
      const fromLocale = context?.fromLocale

      if (locale && fromLocale) {
        // `beforeValidate` fills `data` from the stored document before this hook runs, so it
        // already carries the existing metadata. `req.body` is the raw stream and never held it.
        const existingMeta = data[metaFieldName] || {}
        const translationMeta: TranslationMeta = structuredClone(existingMeta)

        // Ensure structure exists
        if (!translationMeta.translations) {
          translationMeta.translations = {}
        }

        // Update translation relationship
        translationMeta.translations[locale] = {
          date: new Date().toISOString(),
          from: fromLocale as string,
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
  return async ({ context, data, req }) => {
    // Check if this update is from a translation operation
    if (context?.isTranslation) {
      const locale = req.locale
      const fromLocale = context?.fromLocale

      if (locale && fromLocale) {
        // `beforeValidate` fills `data` from the stored document before this hook runs, so it
        // already carries the existing metadata. `req.body` is the raw stream and never held it.
        const existingMeta = data[metaFieldName] || {}
        const translationMeta: TranslationMeta = structuredClone(existingMeta)

        // Ensure structure exists
        if (!translationMeta.translations) {
          translationMeta.translations = {}
        }

        // Update translation relationship
        translationMeta.translations[locale] = {
          date: new Date().toISOString(),
          from: fromLocale as string,
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
