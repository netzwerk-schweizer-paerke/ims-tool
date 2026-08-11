import type { FieldHook } from 'payload'

const format = (val: string): string =>
  val
    .replaceAll(' ', '-')
    .replaceAll(/[^\w-]+/g, '')
    .toLowerCase()

const formatSlugFieldHook =
  (fallback: string): FieldHook =>
  ({ data, operation, originalDoc, value }) => {
    if (typeof value === 'string') {
      return format(value)
    }

    if (operation === 'create') {
      const fallbackData = data?.[fallback] || originalDoc?.[fallback]

      if (fallbackData && typeof fallbackData === 'string') {
        return format(fallbackData)
      }
    }

    return value
  }

export default formatSlugFieldHook
