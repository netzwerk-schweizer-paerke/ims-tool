import { Font } from '@react-pdf/renderer'

/**
 * Turns the built-in hyphenator off.
 *
 * react-pdf hyphenates with an English pattern set. It breaks a German word at the wrong place,
 * and it produced `Au-thentizität` and `Mobil-ität` in this document. An unbroken word and a
 * wider rag read better than a wrong break.
 *
 * The call registers a global callback, so the builder runs it once before it renders.
 */
export const disableHyphenation = (): void => {
  Font.registerHyphenationCallback((word) => [word])
}
