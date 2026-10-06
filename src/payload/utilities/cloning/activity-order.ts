/**
 * The order of the Themen of one park after new ones go in before or after an anchor (PIMS-83).
 * The landscape sorts by `docOrder`, so the caller writes each position back as `docOrder`.
 *
 * A new id that is already in the list moves. An unknown anchor appends the new ids at the end.
 */
export const orderWithInsert = (
  orderedIds: readonly number[],
  newIds: readonly number[],
  anchorId: number,
  placement: 'after' | 'before',
): number[] => {
  const rest = orderedIds.filter((id) => !newIds.includes(id))
  const anchorIndex = rest.indexOf(anchorId)

  if (anchorIndex === -1) {
    return [...rest, ...newIds]
  }

  const at = anchorIndex + (placement === 'before' ? 0 : 1)

  return [...rest.slice(0, at), ...newIds, ...rest.slice(at)]
}

/** The `docOrder` writes that turn the stored order into `order`. Unchanged rows need none. */
export const docOrderChanges = (
  order: readonly number[],
  stored: ReadonlyMap<number, null | number | undefined>,
): Array<{ docOrder: number; id: number }> =>
  order
    .map((id, index) => ({ docOrder: index + 1, id }))
    .filter(({ docOrder, id }) => stored.get(id) !== docOrder)
