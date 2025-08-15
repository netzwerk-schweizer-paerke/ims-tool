import { isArray } from 'es-toolkit/compat'

export function stripIds(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  if (isArray(data)) {
    return data.map((item) => stripIds(item))
  }

  const { id, ...dataWithoutId } = data
  const processed: any = {}

  for (const [key, value] of Object.entries(dataWithoutId)) {
    processed[key] = stripIds(value)
  }

  return processed
}
