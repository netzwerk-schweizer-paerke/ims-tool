import { isArray } from 'es-toolkit/compat'

export function stripIds(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data
  }

  if (isArray(data)) {
    return data.map((item: unknown) => stripIds(item))
  }

  const processed: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') {
      continue
    }
    processed[key] = stripIds(value)
  }

  return processed
}
