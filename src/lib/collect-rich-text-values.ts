import type { Field } from 'payload'

import { tabHasName } from 'payload/shared'

export type RichTextValue = {
  /** Set when the value came out of a `locale: 'all'` map. */
  locale?: string
  /** A dotted path, with an array index for each row. */
  path: string
  value: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const join = (path: string, segment: string) => (path ? `${path}.${segment}` : segment)

/**
 * Walks a field config and the document together, and returns every richText value.
 *
 * `TenantHealthChecker` loads with `locale: 'all'`, so a localized field holds a locale map
 * rather than its value. This splits that map and stamps each entry with its locale.
 */
export const collectRichTextValues = (
  fields: Field[],
  data: unknown,
  path = '',
  locale?: string,
): RichTextValue[] => {
  if (!isRecord(data)) {
    return []
  }

  const found: RichTextValue[] = []

  for (const field of fields) {
    // A row, a collapsible and an unnamed group hold no data of their own.
    if (field.type === 'row' || field.type === 'collapsible') {
      found.push(...collectRichTextValues(field.fields, data, path, locale))
      continue
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        found.push(
          ...(tabHasName(tab)
            ? collectRichTextValues(tab.fields, data[tab.name], join(path, tab.name), locale)
            : collectRichTextValues(tab.fields, data, path, locale)),
        )
      }
      continue
    }

    if (field.type === 'group' && !('name' in field)) {
      found.push(...collectRichTextValues(field.fields, data, path, locale))
      continue
    }

    if (
      field.type !== 'array' &&
      field.type !== 'blocks' &&
      field.type !== 'group' &&
      field.type !== 'richText'
    ) {
      continue
    }

    const fieldPath = join(path, field.name)

    // A localized field arrives as `{ de: …, fr: … }`. Recurse once per locale.
    const entries: [string | undefined, unknown][] =
      field.localized && isRecord(data[field.name])
        ? Object.entries(data[field.name] as Record<string, unknown>)
        : [[locale, data[field.name]]]

    for (const [entryLocale, value] of entries) {
      if (field.type === 'richText') {
        // An absent field is empty, never malformed. Reporting it would flag every
        // optional richText field on every document.
        if (value !== null && value !== undefined) {
          found.push({ locale: entryLocale, path: fieldPath, value })
        }
        continue
      }

      if (field.type === 'group') {
        found.push(...collectRichTextValues(field.fields, value, fieldPath, entryLocale))
        continue
      }

      if (!Array.isArray(value)) {
        continue
      }

      for (const [index, row] of value.entries()) {
        const rowPath = `${fieldPath}[${index}]`

        if (field.type === 'array') {
          found.push(...collectRichTextValues(field.fields, row, rowPath, entryLocale))
          continue
        }

        const blockType = isRecord(row) ? row.blockType : undefined
        const block = field.blocks.find((entry) => entry.slug === blockType)

        if (block) {
          found.push(...collectRichTextValues(block.fields, row, rowPath, entryLocale))
        }
      }
    }
  }

  return found
}
