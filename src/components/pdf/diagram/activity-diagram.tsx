import { Path, Rect, Svg, Text, View } from '@react-pdf/renderer'
import React from 'react'

import { ARROW_HEAD_PATH, buildArrow } from '@/components/graph/fields/graph/lib/arrow-geometry'
import { ActivityColumn, LaidOutBlock } from '@/components/pdf/diagram/block-layout'
import { BlockRects, targetRect } from '@/components/pdf/diagram/target-rects'
import { COLORS, PDF_HEAD_SIZE, PDF_STROKE_WIDTH, styles } from '@/components/pdf/theme'
import { assignActivityBlockArrows } from '@/components/views/activity/overview/activity/lib/assign-activity-block-arrows'
import { Activity } from '@/payload-types'

/** The label clears the pill's end caps, which cut into a centred line. */
const LABEL_INSET = 10

type Props = {
  activities: Activity[]
  columns: ActivityColumn[]
  height: number
  /** The support band draws no arrows, because `activity-support.tsx` renders none either. */
  showArrows?: boolean
  width: number
}

/**
 * The screen's shapes, in PDF primitives.
 *
 * `block.tsx` wraps an input or an output in `IOShapeWrapper`, which is `rounded-full`, and a task
 * in `TaskShapeWrapper`, which is `rounded-xl`. The flow page draws the same two shapes.
 */
const blockOutline = (block: LaidOutBlock) => {
  const { height, width, x, y } = block.rects.root
  const radius = block.shape === 'io' ? height / 2 : 4

  return (
    <Rect
      fill={'none'}
      height={height}
      rx={radius}
      ry={radius}
      stroke={COLORS.outline}
      strokeWidth={PDF_STROKE_WIDTH}
      width={width}
      x={x}
      y={y}
    />
  )
}

/**
 * The arrow stubs of one block.
 *
 * A stored connection describes stubs inside its own block's box, never an edge between two
 * blocks. See the domain map `block-graph`. A target name no definition knows skips its arrow.
 */
const blockArrows = (activity: Activity, blocks: Map<string, BlockRects>) =>
  assignActivityBlockArrows(activity).flatMap((entry, entryIndex) => {
    const rects = blocks.get(entry.id)
    if (!rects) return []

    return entry.arrows.flatMap((spec, index) => {
      const start = targetRect(rects, spec.start)
      const end = targetRect(rects, spec.end)
      if (!start || !end) return []

      const { d, head } = buildArrow(spec, start, end, PDF_HEAD_SIZE)
      const key = `${entry.id}-${entryIndex}-${index}`

      return [
        <React.Fragment key={key}>
          <Path
            d={d}
            fill={'none'}
            stroke={COLORS.outline}
            strokeLinecap={'butt'}
            strokeWidth={PDF_STROKE_WIDTH}
          />
          {head && (
            <Path
              d={ARROW_HEAD_PATH}
              fill={COLORS.outline}
              transform={`translate(${head.x} ${head.y}) rotate(${head.orient}) scale(${head.scale})`}
            />
          )}
        </React.Fragment>,
      ]
    })
  })

/**
 * One row of the landscape: the block shapes and their arrows in an SVG, and the labels above it.
 *
 * The labels sit outside the SVG, because react-pdf cannot wrap text inside one. An absolutely
 * placed `Text` uses the same rectangle the shape does, so the two stay aligned.
 */
export const ActivityDiagram = ({
  activities,
  columns,
  height,
  showArrows = true,
  width,
}: Props) => {
  const boxes = new Map<string, BlockRects>()

  for (const column of columns) {
    for (const block of column.blocks) {
      boxes.set(block.id, block.rects)
    }
  }

  return (
    <View style={{ height, position: 'relative', width }}>
      <Svg height={height} style={{ left: 0, position: 'absolute', top: 0 }} width={width}>
        {columns.flatMap((column) =>
          column.blocks.map((block) => (
            <React.Fragment key={block.id}>{blockOutline(block)}</React.Fragment>
          )),
        )}
        {showArrows && activities.flatMap((activity) => blockArrows(activity, boxes))}
      </Svg>
      {columns.flatMap((column) =>
        column.blocks.map((block) => (
          <View
            key={block.id}
            style={{
              height: block.rects.root.height,
              justifyContent: 'center',
              left: block.rects.root.x,
              paddingHorizontal: LABEL_INSET,
              position: 'absolute',
              top: block.rects.root.y,
              width: block.rects.root.width,
            }}>
            <Text style={styles.blockLabel}>{block.label}</Text>
          </View>
        )),
      )}
    </View>
  )
}
