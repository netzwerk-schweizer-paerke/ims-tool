import { BlockRects } from '@/components/pdf/diagram/target-rects'
import { FLOW_GRAPH_COLUMN, SHAPE_ASPECT } from '@/components/pdf/theme'
import { ProcessTaskCompoundBlock } from '@/components/views/flow/flow-block'

export type FlowBlockLayout = {
  /** The height of the shape band. The connector below it fills the rest of the row. */
  bandHeight: number
  halves: FlowHalf[]
  width: number
}

export type FlowHalf = {
  /** `${block.id}-left` or `${block.id}-right`, which the arrow specs key on. */
  id: string
  label: string
  rects: BlockRects
  shape: FlowShape
}

export type FlowLayoutOptions = {
  /** The graph column, which mirrors the screen's first grid column. */
  columnWidth: number
  /** The wrapper padding around each shape. The screen uses `p-8`. */
  inset: number
}

export type FlowShape = 'io' | 'task' | 'test'

/**
 * The graph column is 200pt of the 531pt A4 content width, so the text keeps 331pt.
 *
 * The screen gives the column 440px of a much wider viewport. A PDF cannot afford that ratio, so
 * the structure is reproduced rather than the pixels. See the decision `pdf-is-a-second-render-path`.
 */
export const DEFAULT_FLOW_LAYOUT: FlowLayoutOptions = {
  columnWidth: FLOW_GRAPH_COLUMN,
  inset: 9,
}

/**
 * The two halves of one flow block, laid out side by side in the graph column.
 *
 * `views/flow/lib/assign-block-arrows.ts` is the reference: a left half exists only when the io or
 * the output half is enabled, and each half owns its arrows. A parallel block has two task halves.
 */
export const layoutFlowBlock = (
  block: ProcessTaskCompoundBlock,
  options: FlowLayoutOptions = DEFAULT_FLOW_LAYOUT,
): FlowBlockLayout => {
  const halves: FlowHalf[] = []
  const halfWidth = options.columnWidth / 2
  const rootWidth = halfWidth - options.inset * 2
  const rootHeight = Math.round(rootWidth / SHAPE_ASPECT)
  const bandHeight = rootHeight + options.inset * 2

  const rectsAt = (index: number): BlockRects => ({
    outer: { height: bandHeight, width: halfWidth, x: index * halfWidth, y: 0 },
    root: {
      height: rootHeight,
      width: rootWidth,
      x: index * halfWidth + options.inset,
      y: options.inset,
    },
  })

  switch (block.blockType) {
    case 'proc-task-io': {
      if (block.graph?.io?.enabled) {
        halves.push({
          id: `${block.id}-left`,
          label: block.graph.io.text ?? '',
          rects: rectsAt(0),
          shape: 'io',
        })
      }
      halves.push({
        id: `${block.id}-right`,
        label: block.graph?.task?.text ?? '',
        rects: rectsAt(1),
        shape: 'task',
      })
      break
    }
    case 'proc-task-p': {
      halves.push(
        {
          id: `${block.id}-left`,
          label: block.graph?.task?.textLeft ?? '',
          rects: rectsAt(0),
          shape: 'task',
        },
        {
          id: `${block.id}-right`,
          label: block.graph?.task?.textRight ?? '',
          rects: rectsAt(1),
          shape: 'task',
        },
      )
      break
    }
    case 'proc-test': {
      if (block.graph?.output?.enabled) {
        halves.push({
          id: `${block.id}-left`,
          label: block.graph.output.text ?? '',
          rects: rectsAt(0),
          shape: 'io',
        })
      }
      halves.push({
        id: `${block.id}-right`,
        label: block.graph?.test?.text ?? '',
        rects: rectsAt(1),
        shape: 'test',
      })
      break
    }
  }

  return { bandHeight, halves, width: options.columnWidth }
}
