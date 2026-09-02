/**
 * A Payload relationship arrives as a bare id or as a populated document, depending on
 * the `depth` of the read. This returns the id in both shapes, and null for anything else.
 */

// `isNumber` from es-toolkit/compat accepts NaN and Infinity, so a bad value used to reach
// a `where` clause as an id. Every id in this schema is a Postgres serial.
const isRelationId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value)

export const getIdFromRelation = (record: unknown): null | number => {
  if (isRelationId(record)) {
    return record
  }

  if (typeof record === 'object' && record !== null && 'id' in record && isRelationId(record.id)) {
    return record.id
  }

  return null
}
