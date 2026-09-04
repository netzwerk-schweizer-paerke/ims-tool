import type { FieldHook } from 'payload'

/**
 * A Lexical text node, with the key set this project's editor stores.
 * Copied from a real `activities_locales.description` row.
 */
const textNode = (text: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  type: 'text',
  version: 1,
})

const paragraph = (text: string) => ({
  children: text.length > 0 ? [textNode(text)] : [],
  direction: text.length > 0 ? 'ltr' : null,
  format: '',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  type: 'paragraph',
  version: 1,
})

const lexicalDocument = (text: string) => ({
  root: {
    children: [paragraph(text)],
    direction: text.length > 0 ? 'ltr' : null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

/**
 * Wraps a primitive value in a richText field into a Lexical document.
 *
 * Payload validates no richText shape, so the REST API and an import script can store a
 * plain string. Null and undefined pass through, because they mean an empty field. An
 * array passes through, because a Slate document needs a different conversion.
 */
export const coerceRichTextFieldHook: FieldHook = ({ value }) => {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === 'object') {
    return value
  }

  return lexicalDocument(String(value))
}
