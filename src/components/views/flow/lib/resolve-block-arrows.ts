import { ArrowSpec } from '@/components/graph/fields/graph/lib/arrow-geometry'
import {
  RootTargetLeftName,
  RootTargetName,
  RootTargetRightName,
} from '@/components/graph/fields/graph/lib/root-target'
import { ProcessTaskCompoundBlock } from '@/components/views/flow/flow-block'
import { assignBlockArrows } from '@/components/views/flow/lib/assign-block-arrows'

/** One end of a drawn arrow: the half that owns the box, and the target that names it. */
export type ArrowEndpoint = {
  halfId: string
  target: string
}

export type ResolvedArrow = {
  end: ArrowEndpoint
  /** The index of the stored connection. A key must stay unique across the whole layer. */
  entryIndex: number
  /** The index of this arrow inside its own connection. */
  index: number
  spec: ArrowSpec
  start: ArrowEndpoint
}

/**
 * A parallel block names the two halves through one entry, so each name picks a whole root box.
 *
 * `RootTargetLeftName` and `RootTargetRightName` mean the left and the right half here. They do
 * not mean the two sides of one shape, which is what `targetRect` returns for every other block.
 */
const parallelEndpoint = (
  target: string,
  leftId: string,
  rightId: string,
): ArrowEndpoint | null => {
  if (target === RootTargetLeftName) {
    return { halfId: leftId, target: RootTargetName }
  }

  if (target === RootTargetRightName) {
    return { halfId: rightId, target: RootTargetName }
  }

  return null
}

/**
 * Every arrow of one flow block, with both endpoints resolved to a half and a target.
 *
 * `assignBlockArrows` states each arrow against its own half. Two stored shapes need an endpoint
 * on the neighbouring half instead, and this function is the one place that rule lives. The screen
 * turns each endpoint into an element id, and the PDF turns it into a rectangle.
 */
export const resolveBlockArrows = (block: ProcessTaskCompoundBlock): ResolvedArrow[] =>
  assignBlockArrows(block).flatMap((entry, entryIndex) => {
    const { arrows, blockType, connection, id, leftId, rightId } = entry

    // Both halves of a parallel block hold the same stored connections, so the left half
    // would draw a duplicate of every arrow the right half already draws.
    if (blockType === 'proc-task-p' && id === leftId) {
      return []
    }

    // An io half draws into the task beside it, so its outward end sits on the right half.
    const crossesToRight = id === leftId && connection.position === 'right'

    return arrows.map((spec, index): ResolvedArrow => {
      let start: ArrowEndpoint =
        crossesToRight && connection.type === 'in'
          ? { halfId: rightId, target: RootTargetName }
          : { halfId: id, target: spec.start }

      let end: ArrowEndpoint =
        crossesToRight && connection.type === 'out'
          ? { halfId: rightId, target: RootTargetName }
          : { halfId: id, target: spec.end }

      if (blockType === 'proc-task-p') {
        start = parallelEndpoint(start.target, leftId, rightId) ?? start
        end = parallelEndpoint(end.target, leftId, rightId) ?? end
      }

      return { end, entryIndex, index, spec, start }
    })
  })
