import { isNumber, isObject } from 'es-toolkit/compat'

export const getIdFromRelation = (record: any): number | null => {
  if (isNumber(record)) {
    return record
  }
  if (isObject(record) && 'id' in record && isNumber(record.id)) {
    return record.id as number
  }
  return null
}
