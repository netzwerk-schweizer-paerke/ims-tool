export const getIdFromRelation = (record: number | Record<string, any> | null | undefined) => {
  if (typeof record === 'number') {
    return record;
  }
  if (record && record.id) {
    return record.id;
  }
  return null;
};
