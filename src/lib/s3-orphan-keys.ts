/**
 * Build the S3 keys an upload row claims.
 *
 * The storage adapter writes an object to `<doc.prefix>/<doc.filename>`, and the static handler
 * reads the prefix back from the stored row. Both columns sit on the row, so the key needs no URL
 * parse. See `.claude/rules/project/pitfalls/s3-upload-prefix-depends-on-beforechange-hook.md`.
 */

export interface StoredKeys {
  /** Every key the row claims. A size variant contributes one key of its own. */
  keys: string[]
  /**
   * True when the row names a file and no key could be built for it. The caller must treat the
   * whole scan as incomplete, because an unbuilt key makes a live object read as an orphan.
   */
  unbuildable: boolean
}

/**
 * Every value is `unknown`, because the rich-text walker passes arbitrary stored JSON. The
 * function narrows each one itself.
 */
export interface UploadRow {
  filename?: unknown
  prefix?: unknown
  sizes?: unknown
}

/**
 * Never normalise the prefix beyond the surrounding slashes.
 *
 * Some rows legitimately sit at `documents/null` or at a doubled legacy prefix. A recomputed
 * `<slug>/<orgId>` would orphan exactly those rows.
 */
export const buildStoredKeys = (row: UploadRow): StoredKeys => {
  const prefix = typeof row.prefix === 'string' ? row.prefix.replaceAll(/^\/+|\/+$/g, '') : ''
  const filenames = collectFilenames(row)

  if (filenames.length === 0) {
    // The row names no file at all, so it claims no object.
    return { keys: [], unbuildable: false }
  }

  if (prefix === '') {
    return { keys: [], unbuildable: true }
  }

  return { keys: filenames.map((filename) => `${prefix}/${filename}`), unbuildable: false }
}

const collectFilenames = (row: UploadRow): string[] => {
  const filenames: string[] = []

  if (isNonEmptyString(row.filename)) filenames.push(row.filename)

  const sizes = row.sizes && typeof row.sizes === 'object' ? row.sizes : {}

  for (const variant of Object.values(sizes)) {
    // An unset size variant is normal. Payload writes every key with a null value.
    if (!variant || typeof variant !== 'object' || !('filename' in variant)) continue

    const filename = (variant as { filename?: unknown }).filename
    if (isNonEmptyString(filename)) filenames.push(filename)
  }

  return filenames
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value !== ''
