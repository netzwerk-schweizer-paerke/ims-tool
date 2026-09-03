/**
 * The arrow geometry of the block graph, as a pure function of two measured rectangles.
 * Every formula is ported from the fork's `GetPosition.ts` under the inputs this project
 * passes. See `.claude/docs/systems/block-graph-editor.md` for the ported constants.
 */

export type AnchorSide = 'bottom' | 'left' | 'right' | 'top'

export type ArrowGeometry = { d: string; head: ArrowHead | null }

export type ArrowHead = { orient: number; scale: number; x: number; y: number }

/**
 * One arrow of a connection definition. `start` and `end` are target names. The layer
 * concatenates them with a per-block id prefix to reach a DOM element.
 */
export type ArrowSpec = {
  end: string
  endAnchor: AnchorSide
  showHead?: boolean
  /** No definition enables a tail. The field stays so the records keep type-checking. */
  showTail?: boolean
  start: string
  startAnchor: AnchorSide
}

export type Point = { x: number; y: number }

export type Rect = { height: number; width: number; x: number; y: number }

/** `strokeWidth * headSize` in the fork's terms. The head path is a unit square. */
const HEAD_SIZE = 12

/** `arrowShapes.arrow1.offsetForward` */
const HEAD_OFFSET_FORWARD = 0.25

const HEAD_OFFSET = HEAD_SIZE * HEAD_OFFSET_FORWARD

/** How far the grid break pulls a control point back to clear the head. */
const HEAD_CORRECTION = (HEAD_SIZE * (1 - HEAD_OFFSET_FORWARD)) / 2

/** The unit-square head from the fork's `constants.tsx`. The transform scales it. */
export const ARROW_HEAD_PATH = 'M 0 0 L 1 0.5 L 0 1 L 0.25 0.5 z'

/** The `strokeWidth` the old `arrowStyle` passed to every arrow. */
export const ARROW_STROKE_WIDTH = 2

const isHorizontal = (side: AnchorSide) => side === 'left' || side === 'right'

/** Ports `getAnchorsDefaultOffsets` from the fork's `anchors.ts`. */
export const anchorPoint = (rect: Rect, side: AnchorSide): Point => {
  switch (side) {
    case 'bottom': {
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height }
    }
    case 'left': {
      return { x: rect.x, y: rect.y + rect.height / 2 }
    }
    case 'right': {
      return { x: rect.x + rect.width, y: rect.y + rect.height / 2 }
    }
    case 'top': {
      return { x: rect.x + rect.width / 2, y: rect.y }
    }
  }
}

/**
 * Builds one arrow from its two endpoint rectangles. Both rectangles must sit in the same
 * coordinate space. The caller measures once per layer and reuses the result.
 */
export const buildArrow = (spec: ArrowSpec, startRect: Rect, endRect: Rect): ArrowGeometry => {
  const start = anchorPoint(startRect, spec.startAnchor)
  const end = anchorPoint(endRect, spec.endAnchor)
  const showHead = spec.showHead ?? true

  const dx = end.x - start.x
  const dy = end.y - start.y
  // The deltas keep their unshortened values. The grid break divides the original span,
  // never the span that the head correction leaves behind.
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  const xSign = dx > 0 ? 1 : -1
  const ySign = dy > 0 ? 1 : -1

  const x1 = start.x
  const y1 = start.y
  let x2 = end.x
  let y2 = end.y

  let xHeadOffset = 0
  let yHeadOffset = 0
  let headOrient = 0

  if (showHead) {
    if (isHorizontal(spec.endAnchor)) {
      xHeadOffset += HEAD_OFFSET * xSign
      x2 -= HEAD_SIZE * (1 - HEAD_OFFSET_FORWARD) * xSign
      yHeadOffset += (HEAD_SIZE * xSign) / 2
      headOrient =
        spec.endAnchor === 'left' ? (xSign < 0 ? 180 : 0) : xSign > 0 ? 360 : 180
    } else {
      xHeadOffset += (HEAD_SIZE * -ySign) / 2
      // The fork reads `yHeadOffset` here after the line above writes it. Keep the order.
      yHeadOffset += HEAD_OFFSET * ySign
      y2 -= HEAD_SIZE * ySign - yHeadOffset
      headOrient = spec.endAnchor === 'top' ? (ySign > 0 ? 450 : 270) : ySign < 0 ? 270 : 90
    }
  }

  // The control points start from the shortened end, which is what the fork does.
  let cpx1 = x1
  let cpy1 = y1
  let cpx2 = x2
  let cpy2 = y2

  const startDir = isHorizontal(spec.startAnchor) ? 'h' : 'v'
  const endDir = isHorizontal(spec.endAnchor) ? 'h' : 'v'

  switch (`${startDir}${endDir}`) {
    case 'hh': {
      cpx1 += absDx * 0.5 * xSign
      cpx2 -= absDx * 0.5 * xSign
      if (showHead) {
        cpx1 -= HEAD_CORRECTION * xSign
        cpx2 += HEAD_CORRECTION * xSign
      }
      break
    }
    case 'hv': {
      cpx1 = x2
      break
    }
    case 'vh': {
      cpy1 = y2
      break
    }
    default: {
      cpy1 += absDy * 0.5 * ySign
      cpy2 -= absDy * 0.5 * ySign
      if (showHead) {
        cpy1 -= HEAD_CORRECTION * ySign
        cpy2 += HEAD_CORRECTION * ySign
      }
    }
  }

  return {
    d: `M ${x1} ${y1} L ${cpx1} ${cpy1} L ${cpx2} ${cpy2} L ${x2} ${y2}`,
    head: showHead
      ? { orient: headOrient, scale: HEAD_SIZE, x: x2 - xHeadOffset, y: y2 - yHeadOffset }
      : null,
  }
}
