export const isEmpty = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.length === 0
  }
  if (value === null || typeof value === 'undefined') {
    return true
  }
  return typeof value === 'object' && Object.keys(value).length === 0
}
