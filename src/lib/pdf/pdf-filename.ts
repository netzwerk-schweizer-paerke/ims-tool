/** Latin-1 accents the parks use, folded so a filename stays portable across systems. */
const FOLD: Record<string, string> = {
  à: 'a',
  â: 'a',
  ä: 'ae',
  ç: 'c',
  é: 'e',
  è: 'e',
  ê: 'e',
  í: 'i',
  ì: 'i',
  î: 'i',
  ó: 'o',
  ò: 'o',
  ô: 'o',
  ö: 'oe',
  ß: 'ss',
  ú: 'u',
  ù: 'u',
  û: 'u',
  ü: 'ue',
}

/** A filename segment: folded, lower case, and joined with single hyphens. */
export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replaceAll(/[äàâçéèêìíîòóôöùúûüß]/g, (char) => FOLD[char] ?? char)
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')

/** A long park or page name makes a name no file dialog can show. */
const MAX_SEGMENT = 48

/** Cuts a slug at the last whole word inside the cap. */
export const clampSegment = (slug: string, max = MAX_SEGMENT): string => {
  if (slug.length <= max) {
    return slug
  }

  const cut = slug.slice(0, max)
  const lastWord = cut.lastIndexOf('-')

  return lastWord > max / 2 ? cut.slice(0, lastWord) : cut
}

type Args = {
  /** True when the export carries every page under the target. */
  deep: boolean
  /** The word for a deep export, in the document's own language. */
  deepLabel: string
  organisationName: string
  /** The build time, for the date segment. */
  producedAt: Date
  /** The page the export started from. */
  title: string
}

/**
 * The download name, which says which park and which page the document came from.
 *
 * A reader who keeps several exports needs to tell them apart without opening them, so the name
 * carries the park, the page, the scope and the date. An underscore separates the fields and a
 * hyphen separates the words inside one field.
 */
export const pdfFilename = ({
  deep,
  deepLabel,
  organisationName,
  producedAt,
  title,
}: Args): string => {
  const date = producedAt.toISOString().slice(0, 10)
  const park = clampSegment(slugify(organisationName))
  const page = clampSegment(slugify(title))
  const parts = [park, page === park ? null : page, deep ? slugify(deepLabel) : null, date]

  return `${parts.filter((part): part is string => Boolean(part)).join('_')}.pdf`
}
