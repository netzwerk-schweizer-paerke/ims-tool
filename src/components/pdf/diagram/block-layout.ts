import { BlockRects } from '@/components/pdf/diagram/target-rects'
import { SHAPE_ASPECT } from '@/components/pdf/theme'
import { ActivityTaskCompoundBlock } from '@/components/views/activity/overview/activity/block'
import { Activity } from '@/payload-types'

export type ActivityColumn = {
  blocks: LaidOutBlock[]
  /** The stacked height of the blocks, with no title. */
  height: number
  title: string
  width: number
}

export type LaidOutBlock = {
  /** The stored block id. An arrow spec keys its targets on it. */
  id: string
  label: string
  rects: BlockRects
  /** An input or an output draws a slanted box. A task draws a rectangle. */
  shape: 'io' | 'task'
}

export type LayoutOptions = {
  blockHeight: number
  /**
   * The vertical space between two stacked wrapper boxes.
   *
   * Keep this at 0 while the blocks carry arrows. A bottom target sits `TARGET_NUDGE` below its
   * wrapper and a top target the same distance above the next one, so the two stubs meet only
   * when the wrappers touch. The screen stacks `.activity-block` with no gap for that reason.
   */
  gap: number
  /** The wrapper padding around the shape. `activity/block-wrapper.tsx` uses `p-8`. */
  inset: number
}

/**
 * The largest a block gets. A short row keeps this size rather than fill the page.
 *
 * The numbers match `diagram/flow-layout.ts`, so an activity block on the landscape page and a
 * task on a flow page draw the same box. The inset alone separates two stacked shapes.
 */
export const DEFAULT_LAYOUT: LayoutOptions = { blockHeight: 68, gap: 0, inset: 9 }

/** The width one block takes, derived from its height and the screen's shape proportions. */
export const blockWidthOf = (options: LayoutOptions): number =>
  Math.round((options.blockHeight - options.inset * 2) * SHAPE_ASPECT) + options.inset * 2

/** How many blocks of one column fit the space a page gives it. */
export const blocksPerSlice = (available: number, options: LayoutOptions): number =>
  Math.max(1, Math.floor((available + options.gap) / (options.blockHeight + options.gap)))

/**
 * Cuts a laid-out row into page-sized slices, and moves each slice back to the row origin.
 *
 * One group is one SVG, so a group taller than the page clips under `wrap={false}`. The cut runs
 * at the same index in every column, so the columns stay aligned across a page break.
 */
export const sliceRow = (
  columns: ActivityColumn[],
  perSlice: number,
  options: LayoutOptions,
): ActivityColumn[][] => {
  const longest = Math.max(...columns.map((column) => column.blocks.length), 0)
  const sliceCount = Math.max(1, Math.ceil(longest / perSlice))
  const step = options.blockHeight + options.gap

  return Array.from({ length: sliceCount }, (_, slice) =>
    columns.map((column) => {
      const blocks = column.blocks
        .slice(slice * perSlice, (slice + 1) * perSlice)
        .map((block) => ({
          ...block,
          rects: {
            outer: { ...block.rects.outer, y: block.rects.outer.y - slice * perSlice * step },
            root: { ...block.rects.root, y: block.rects.root.y - slice * perSlice * step },
          },
        }))

      return {
        ...column,
        blocks,
        height: blocks.length === 0 ? 0 : blocks.length * options.blockHeight + (blocks.length - 1) * options.gap,
      }
    }),
  )
}

type OrderedBlock = { block: ActivityTaskCompoundBlock; shape: 'io' | 'task' }

/**
 * One activity's blocks in the order the screen draws them.
 *
 * `activity-flow.tsx` reads the same order: a leading input, then the tasks, then a trailing
 * output. A block with no label still takes its slot, so the arrows keep their positions.
 */
const orderedBlocks = (activity: Activity): OrderedBlock[] => {
  const stored = activity.blocks ?? []
  const ordered: OrderedBlock[] = []

  for (const [index, block] of stored.entries()) {
    const compound = block as ActivityTaskCompoundBlock

    if (block.blockType === 'activity-io' && (index === 0 || index === stored.length - 1)) {
      ordered.push({ block: compound, shape: 'io' })
      continue
    }

    if (block.blockType === 'activity-task') {
      ordered.push({ block: compound, shape: 'task' })
    }
  }

  return ordered
}

/** One block's wrapper box and the shape box inside its padding. */
const blockAt = (
  entry: OrderedBlock,
  x: number,
  y: number,
  blockWidth: number,
  options: LayoutOptions,
): LaidOutBlock => ({
  id: entry.block.id,
  label: entry.block.graph?.task?.text ?? '',
  rects: {
    outer: { height: options.blockHeight, width: blockWidth, x, y },
    root: {
      height: options.blockHeight - options.inset * 2,
      width: blockWidth - options.inset * 2,
      x: x + options.inset,
      y: y + options.inset,
    },
  },
  shape: entry.shape,
})

/** Stacks one activity's blocks into a column, as the strategy and standard bands draw them. */
export const layoutActivityColumn = (
  activity: Activity,
  origin: { x: number; y: number },
  options: LayoutOptions = DEFAULT_LAYOUT,
): ActivityColumn => {
  const ordered = orderedBlocks(activity)
  const blockWidth = blockWidthOf(options)

  const blocks = ordered.map((entry, index) =>
    blockAt(
      entry,
      origin.x,
      origin.y + index * (options.blockHeight + options.gap),
      blockWidth,
      options,
    ),
  )

  const height =
    blocks.length === 0
      ? 0
      : blocks.length * options.blockHeight + (blocks.length - 1) * options.gap

  return { blocks, height, title: activity.name, width: blockWidth }
}

/**
 * Wraps one activity's blocks across the width it is given, as the support band draws them.
 *
 * `activity-support.tsx` lays its blocks out with `flex-row flex-wrap` and renders no arrows. A
 * column would make one support activity of 8 blocks eight blocks tall, which no page holds.
 */
export const layoutActivityGrid = (
  activity: Activity,
  origin: { x: number; y: number },
  availableWidth: number,
  columnGap: number,
  options: LayoutOptions = DEFAULT_LAYOUT,
): ActivityColumn => {
  const ordered = orderedBlocks(activity)
  const blockWidth = blockWidthOf(options)
  const perRow = Math.max(1, Math.floor((availableWidth + columnGap) / (blockWidth + columnGap)))

  const blocks = ordered.map((entry, index) =>
    blockAt(
      entry,
      origin.x + (index % perRow) * (blockWidth + columnGap),
      origin.y + Math.floor(index / perRow) * options.blockHeight,
      blockWidth,
      options,
    ),
  )

  return {
    blocks,
    height: Math.ceil(ordered.length / perRow) * options.blockHeight,
    title: activity.name,
    width: availableWidth,
  }
}

/** How many grid rows fit the space a page gives one band. */
export const gridRowsPerSlice = (available: number, options: LayoutOptions): number =>
  Math.max(1, Math.floor(available / options.blockHeight))

/**
 * Cuts a wrapped band into page-sized slices of whole rows, and moves each slice back to the top.
 *
 * One SVG cannot break, so a band taller than the page clips under `wrap={false}`. The cut reads
 * the row a block sits on, never its index, because one grid row holds many blocks.
 */
export const sliceGrid = (
  columns: ActivityColumn[],
  rowsPerSlice: number,
  options: LayoutOptions = DEFAULT_LAYOUT,
): ActivityColumn[][] => {
  const tallest = Math.max(...columns.map((column) => column.height), options.blockHeight)
  const rows = Math.max(1, Math.ceil(tallest / options.blockHeight))
  const sliceCount = Math.max(1, Math.ceil(rows / rowsPerSlice))
  const band = rowsPerSlice * options.blockHeight

  return Array.from({ length: sliceCount }, (_, slice) => {
    const top = slice * band

    return columns.map((column) => {
      const blocks = column.blocks
        .filter((block) => block.rects.outer.y >= top && block.rects.outer.y < top + band)
        .map((block) => ({
          ...block,
          rects: {
            outer: { ...block.rects.outer, y: block.rects.outer.y - top },
            root: { ...block.rects.root, y: block.rects.root.y - top },
          },
        }))

      const rowCount = new Set(
        blocks.map((block) => Math.round(block.rects.outer.y / options.blockHeight)),
      ).size

      return { ...column, blocks, height: rowCount * options.blockHeight }
    })
  })
}

/**
 * Places one column per activity, left to right.
 *
 * The caller supplies the row's origin, so the landscape can stack the strategy, the standard and
 * the support rows with its own spacing.
 */
export const layoutActivityRow = (
  activities: Activity[],
  origin: { x: number; y: number },
  columnGap: number,
  options: LayoutOptions = DEFAULT_LAYOUT,
): ActivityColumn[] =>
  activities.map((activity, index) =>
    layoutActivityColumn(
      activity,
      { x: origin.x + index * (blockWidthOf(options) + columnGap), y: origin.y },
      options,
    ),
  )
