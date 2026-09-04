import { traverseRichText } from '@/plugins/deeplTranslate/server/utilities/traverse-rich-text'

/** The keys a graph JSON field uses for the labels it draws inside a block. */
const GRAPH_TEXT_KEYS = ['text', 'textBottom', 'textLeft', 'textRight', 'textTop']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Flattens one stored value to the text a person reads.
 *
 * It covers the three shapes this project stores. A plain string stays itself. A Lexical
 * document loses its markup. A graph JSON object gives up the five label keys.
 */
export const toSearchText = (value: unknown): string => {
  // A richText column accepts a primitive, so a string reaches this function.
  // See `payload-richtext-accepts-a-primitive`.
  if (typeof value === 'string') {
    return value.trim()
  }

  if (!isRecord(value)) {
    return ''
  }

  if (isRecord(value.root)) {
    const parts: string[] = []

    traverseRichText({
      onText: (node) => {
        if (typeof node.text === 'string') {
          parts.push(node.text)
        }
      },
      root: value.root,
    })

    return parts.join(' ').trim()
  }

  return GRAPH_TEXT_KEYS.map((key) => value[key])
    .filter((part): part is string => typeof part === 'string')
    .join(' ')
    .trim()
}

/** Joins several stored values into one searchable body, and drops the empty ones. */
export const joinSearchText = (values: unknown[]): string =>
  values
    .map((value) => toSearchText(value))
    .filter((text) => text.length > 0)
    .join(' · ')
