import type { FieldHook } from 'payload'

// The graph JSON schema declares these five string keys. See
// src/payload/collections/json-schemas/connection-schema.ts.
const TEXT_KEYS = ['text', 'textBottom', 'textLeft', 'textRight', 'textTop'] as const

/**
 * Strips leading and trailing whitespace from every text key of a graph JSON field.
 *
 * Users pad a block label with empty lines to shift it inside its shape. Those lines
 * reach the database, the translation pipeline and the clone endpoints. This hook runs
 * on the server, outside the admin form-state path, so it never disturbs the local
 * mirror in `use-text-field.tsx`.
 *
 * Returns the original object when nothing changed, so an unchanged field writes nothing new.
 */
export const trimGraphTextFieldHook: FieldHook = ({ value }) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value
  }

  const graph = value as Record<string, unknown>
  let trimmed: Record<string, unknown> | undefined

  for (const key of TEXT_KEYS) {
    const text = graph[key]

    if (typeof text !== 'string') {
      continue
    }

    const next = text.trim()

    if (next === text) {
      continue
    }

    trimmed ??= { ...graph }
    trimmed[key] = next
  }

  return trimmed ?? value
}
