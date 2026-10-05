/**
 * Where a pasted Prozessgruppe goes: after the last block, but before a closing input/output
 * block. The landscape draws an input/output block only at the first or the last index, so a
 * block appended after it would hide the output (PIMS-83).
 */
export const blockInsertIndex = (blocks: readonly { blockType?: string }[]): number => {
  const last = blocks.at(-1)

  return blocks.length > 1 && last?.blockType === 'activity-io' ? blocks.length - 1 : blocks.length
}

/** A new array with `block` at `blockInsertIndex`. The stored blocks keep their order and ids. */
export const insertBlock = <TBlock extends { blockType?: string }>(
  blocks: readonly TBlock[],
  block: TBlock,
): TBlock[] => {
  const index = blockInsertIndex(blocks)

  return [...blocks.slice(0, index), block, ...blocks.slice(index)]
}
