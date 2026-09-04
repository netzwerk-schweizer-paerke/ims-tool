import { describe, expect, test } from 'vitest'

import { buildArrow } from '@/components/graph/fields/graph/lib/arrow-geometry'
import { assignActivityBlockArrows } from '@/components/views/activity/overview/activity/lib/assign-activity-block-arrows'
import { Activity } from '@/payload-types'

import { layoutActivityColumn } from './block-layout'
import { targetRect } from './target-rects'

const activityWith = (connections: { position: string; type: string }[]): Activity =>
  ({
    blocks: [
      { blockType: 'activity-task', graph: { task: { connections, text: 'A task' } }, id: 'b1' },
    ],
    name: 'One',
  }) as unknown as Activity

/** The whole chain the diagram runs: stored connections to a drawable path. */
const pathsFor = (activity: Activity): string[] => {
  const column = layoutActivityColumn(activity, { x: 0, y: 0 })
  const boxes = new Map(column.blocks.map((block) => [block.id, block.rects]))

  return assignActivityBlockArrows(activity).flatMap((entry) => {
    const box = boxes.get(entry.id)
    if (!box) return []

    return entry.arrows.flatMap((spec) => {
      const start = targetRect(box, spec.start)
      const end = targetRect(box, spec.end)
      return start && end ? [buildArrow(spec, start, end).d] : []
    })
  })
}

describe('the arrow pipeline', () => {
  test('draws nothing when every connection is none, which is what most parks store', () => {
    const paths = pathsFor(
      activityWith([
        { position: 'top', type: 'none' },
        { position: 'right', type: 'none' },
        { position: 'bottom', type: 'none' },
      ]),
    )

    expect(paths).toEqual([])
  })

  test('draws a path for an incoming top arrow', () => {
    const paths = pathsFor(activityWith([{ position: 'top', type: 'in' }]))

    expect(paths).toHaveLength(1)
    expect(paths[0]).toMatch(/^M [\d.-]+ [\d.-]+ L/)
  })

  test('draws a path for an outgoing bottom arrow', () => {
    const paths = pathsFor(activityWith([{ position: 'bottom', type: 'out' }]))

    expect(paths).toHaveLength(1)
  })

  test('draws both paths of a two-arrow definition', () => {
    const paths = pathsFor(activityWith([{ position: 'right', type: 'in-pass-by' }]))

    expect(paths).toHaveLength(2)
  })

  test('skips a connection whose type no definition knows', () => {
    const paths = pathsFor(activityWith([{ position: 'top', type: 'sideways' }]))

    expect(paths).toEqual([])
  })

  test('produces a head for an arrow that ends on the block itself', () => {
    const column = layoutActivityColumn(activityWith([{ position: 'top', type: 'in' }]), {
      x: 0,
      y: 0,
    })
    const box = column.blocks[0].rects
    const [entry] = assignActivityBlockArrows(activityWith([{ position: 'top', type: 'in' }]))
    const spec = entry.arrows[0]
    const arrow = buildArrow(spec, targetRect(box, spec.start)!, targetRect(box, spec.end)!)

    expect(arrow.head).not.toBeNull()
    expect(Number.isFinite(arrow.head?.x)).toBe(true)
  })
})
