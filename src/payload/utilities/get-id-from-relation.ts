export const getIdFromRelation = (
  record: number | string | Record<string, any> | null | undefined,
): string | number | null => {
  if (typeof record === 'number' || typeof record === 'string') {
    return record
  }
  if (record && typeof record === 'object' && 'id' in record) {
    return record.id as string | number
  }
  return null
}
