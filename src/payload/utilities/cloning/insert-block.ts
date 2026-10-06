/**
 * Where a pasted Prozessgruppe goes: after the last block, but before a closing input/output
 * block. The landscape draws an input/output block only at the first or the last index, so a
 * block appended after it would hide the output (PIMS-83).
 */
export const blockInsertIndex = (blocks: readonly { blockType?: string }[]): number => {
  const last = blocks.at(-1)

  return blocks.length > 1 && last?.blockType === 'activity-io' ? blocks.length - 1 : blocks.length
}

/** "Davor" or "Danach" one Prozessgruppe of the same Thema, as an index in one locale. */
export type BlockAnchor = { index: number; placement: 'after' | 'before' }

/**
 * The index next to an anchor. A locale whose block at that index is no task block has fallen
 * out of step, so the block then goes to the default position instead.
 */
export const anchoredBlockIndex = (
  blocks: readonly { blockType?: string }[],
  anchor: BlockAnchor,
): number =>
  blocks[anchor.index]?.blockType === 'activity-task'
    ? anchor.index + (anchor.placement === 'before' ? 0 : 1)
    : blockInsertIndex(blocks)

/** A new array with `block` at its position. The stored blocks keep their order and ids. */
export const insertBlock = <TBlock extends { blockType?: string }>(
  blocks: readonly TBlock[],
  block: TBlock,
  anchor?: BlockAnchor,
): TBlock[] => {
  const index = anchor ? anchoredBlockIndex(blocks, anchor) : blockInsertIndex(blocks)

  return [...blocks.slice(0, index), block, ...blocks.slice(index)]
}
