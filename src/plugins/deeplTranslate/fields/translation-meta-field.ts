import type { Field } from 'payload'

/**
 * Creates a translation metadata field to track translation status
 * This field stores timestamps for each locale to determine if translations are outdated
 */
export const translationMetaField = (fieldName: string = 'translationMeta'): Field => ({
  access: {
    read: () => true,
    update: () => false, // Only updated programmatically
  },
  admin: {
    disableBulkEdit: true,
    hidden: true, // Always hide from UI
    readOnly: true,
  },
  name: fieldName,
  type: 'json',
})

export type TranslationMeta = {
  // Timestamps for when each locale was last modified
  lastModified: {
    [locale: string]: string // ISO date string
  }
  // Track translation relationships between locales
  // e.g., translations['fr'] = { from: 'de', date: '2024-01-01', isOutdated: true }
  // This means FR was translated from DE on that date, and DE has changed since then
  translations?: {
    [targetLocale: string]: {
      date: string // ISO date string when translated
      from: string // source locale it was translated from
      isOutdated?: boolean // true if source has changed since translation
    }
  }
}
