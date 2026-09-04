import { de } from '@/lib/translations/de'
import { fr } from '@/lib/translations/fr'
import { it } from '@/lib/translations/it'

const CATALOGUES = { de, fr, it }

export type PdfCatalogue = typeof de

export type PdfLabels = PdfCatalogue['pdf']

/**
 * The document strings, in the content locale.
 *
 * A PDF renders on the server with no React context, so `useTranslation` is unavailable. The
 * catalogue objects are plain data, so the document reads the right one directly. The admin
 * language never applies here, because the document carries content, not admin chrome.
 */
export const pdfCatalogue = (locale: string): PdfCatalogue =>
  Object.hasOwn(CATALOGUES, locale) ? CATALOGUES[locale as keyof typeof CATALOGUES] : de

/**
 * One string from an `I18nCollection` label, which stores every language in one object.
 *
 * Those labels name the domain terms, so the document reuses them rather than restating them.
 */
export const localeLabel = (entry: Record<string, string>, locale: string): string =>
  entry[locale] ?? entry.de ?? ''
