import { Rect } from '@/components/graph/fields/graph/lib/arrow-geometry'
import { OuterTargetsEnum } from '@/components/graph/fields/graph/lib/outer-targets'
import {
  RootTargetLeftName,
  RootTargetName,
  RootTargetRightName,
} from '@/components/graph/fields/graph/lib/root-target'

/** The screen renders each outer target as a 2px square. */
export const TARGET_SIZE = 2

/**
 * Tailwind's `translate-y-1` is 0.25rem, which is 4px at the admin root font size.
 *
 * A top target sits this far above its box and a bottom target this far below it, so a canvas
 * that must show both needs the same padding.
 */
export const TARGET_NUDGE = 4

/**
 * The two boxes one block half owns.
 *
 * `views/flow/block-wrapper.tsx` renders `OuterTargets` as a child of the padded wrapper, and
 * `.root-target` inside that padding. The two rectangles therefore differ, and an arrow that
 * joins a root target to an outer target spans the padding.
 */
export type BlockRects = {
  /** The wrapper cell. The eight outer targets sit on its edges. */
  outer: Rect
  /** The shape box inside the wrapper padding. `root-target` names it. */
  root: Rect
}

/**
 * The rectangle of one outer target, derived from its wrapper box.
 *
 * The screen positions these with absolute offsets and a transform, and it measures the result.
 * A PDF has no layout to measure, so the same offsets are computed here. See `outer-targets.tsx`
 * for the element each case mirrors.
 */
export const outerTargetRect = (block: Rect, name: OuterTargetsEnum): Rect => {
  const right = block.x + block.width - TARGET_SIZE
  const bottom = block.y + block.height - TARGET_SIZE + TARGET_NUDGE
  const centerX = block.x + block.width / 2 - TARGET_SIZE / 2
  const centerY = block.y + block.height / 2 - TARGET_SIZE / 2
  const top = block.y - TARGET_NUDGE
  const size = { height: TARGET_SIZE, width: TARGET_SIZE }

  switch (name) {
    case OuterTargetsEnum.BOTTOM_CENTER: {
      return { ...size, x: centerX, y: bottom }
    }
    case OuterTargetsEnum.BOTTOM_LEFT: {
      return { ...size, x: block.x, y: bottom }
    }
    case OuterTargetsEnum.BOTTOM_RIGHT: {
      return { ...size, x: right, y: bottom }
    }
    case OuterTargetsEnum.CENTER_LEFT: {
      return { ...size, x: block.x, y: centerY }
    }
    case OuterTargetsEnum.CENTER_RIGHT: {
      return { ...size, x: right, y: centerY }
    }
    case OuterTargetsEnum.TOP_CENTER: {
      return { ...size, x: centerX, y: top }
    }
    case OuterTargetsEnum.TOP_LEFT: {
      return { ...size, x: block.x, y: top }
    }
    case OuterTargetsEnum.TOP_RIGHT: {
      return { ...size, x: right, y: top }
    }
  }
}

const isOuterTarget = (name: string): name is OuterTargetsEnum =>
  Object.values(OuterTargetsEnum).includes(name as OuterTargetsEnum)

/**
 * The rectangle an arrow endpoint names, or null when no target carries that name.
 *
 * A stored connection can name anything, so an unknown name skips the arrow rather than throwing.
 * See the pitfall `graph-connection-lookup-must-tolerate-unknown-stored-values`.
 */
export const targetRect = (rects: BlockRects, name: string): null | Rect => {
  if (name === RootTargetName) {
    return rects.root
  }

  if (name === RootTargetLeftName) {
    return { ...rects.root, width: rects.root.width / 2 }
  }

  if (name === RootTargetRightName) {
    return {
      ...rects.root,
      width: rects.root.width / 2,
      x: rects.root.x + rects.root.width / 2,
    }
  }

  return isOuterTarget(name) ? outerTargetRect(rects.outer, name) : null
}
