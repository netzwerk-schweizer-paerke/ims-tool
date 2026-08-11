export const isEmpty = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.length === 0
  }
  if (value === null || value === undefined) {
    return true
  }
  return typeof value === 'object' && Object.keys(value).length === 0
}
