import { Path, Polygon, Svg, Rect as SvgRect, Text, View } from '@react-pdf/renderer'
import React from 'react'

import { ARROW_HEAD_PATH, buildArrow } from '@/components/graph/fields/graph/lib/arrow-geometry'
import { OuterTargetsEnum } from '@/components/graph/fields/graph/lib/outer-targets'
import { FlowHalf, layoutFlowBlock } from '@/components/pdf/diagram/flow-layout'
import { BlockRects, TARGET_NUDGE, targetRect } from '@/components/pdf/diagram/target-rects'
import { COLORS, PDF_HEAD_SIZE, PDF_STROKE_WIDTH, styles } from '@/components/pdf/theme'
import { ProcessTaskCompoundBlock } from '@/components/views/flow/flow-block'
import { assignBlockArrows } from '@/components/views/flow/lib/assign-block-arrows'

/**
 * The nudged targets sit outside the band, so the canvas needs air above and below.
 *
 * It matches the nudge exactly. A larger pad would leave a gap between the top stub and the run
 * that arrives from the block above.
 */
const BAND_PAD = TARGET_NUDGE

/** A target on the bottom edge continues into the next block, so the run needs a connector. */
const BOTTOM_TARGETS = new Set<string>([
  OuterTargetsEnum.BOTTOM_CENTER,
  OuterTargetsEnum.BOTTOM_LEFT,
  OuterTargetsEnum.BOTTOM_RIGHT,
])

/**
 * The screen's shapes, in PDF primitives.
 *
 * `IOShapeWrapper` is `rounded-full`, `TaskShapeWrapper` is `rounded-xl`, and `TestShapeWrapper`
 * draws a diamond polygon. All three carry a border and no fill.
 */
const shapeFor = (half: FlowHalf) => {
  const { height, width, x, y } = half.rects.root

  if (half.shape === 'test') {
    const points = [
      `${x + width / 2},${y}`,
      `${x + width},${y + height / 2}`,
      `${x + width / 2},${y + height}`,
      `${x},${y + height / 2}`,
    ].join(' ')
    return (
      <Polygon
        fill={'none'}
        points={points}
        stroke={COLORS.outline}
        strokeWidth={PDF_STROKE_WIDTH}
      />
    )
  }

  const radius = half.shape === 'io' ? height / 2 : 4

  return (
    <SvgRect
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
 * Where a run leaves the band downwards, as x offsets in the column.
 *
 * The screen draws one arrow that reaches the bottom of the whole grid row, because its box is the
 * row. A PDF cannot know the row height, so the band draws the stub and a stretched line below it
 * carries the run to the row bottom. The next block's top stub then meets it.
 */
const connectorOffsets = (
  block: ProcessTaskCompoundBlock,
  boxes: Map<string, BlockRects>,
): number[] => {
  const offsets = new Set<number>()

  for (const entry of assignBlockArrows(block)) {
    const rects = boxes.get(entry.id)
    if (!rects) continue

    for (const spec of entry.arrows) {
      for (const name of [spec.start, spec.end]) {
        if (!BOTTOM_TARGETS.has(name)) continue
        const rect = targetRect(rects, name)
        if (rect) offsets.add(rect.x + rect.width / 2)
      }
    }
  }

  return [...offsets].sort((a, b) => a - b)
}

/**
 * One flow block: its two halves, their arrows, and the connector that reaches the row bottom.
 *
 * A stored connection describes stubs inside its own half's boxes. `assignBlockArrows` resolves
 * them, and a target name no definition knows skips its arrow rather than throwing.
 */
export const FlowBlockDiagram = ({ block }: { block: ProcessTaskCompoundBlock }) => {
  const layout = layoutFlowBlock(block)

  if (layout.halves.length === 0) {
    return null
  }

  const boxes = new Map<string, BlockRects>(layout.halves.map((half) => [half.id, half.rects]))
  const canvasHeight = layout.bandHeight + BAND_PAD * 2
  const offsets = connectorOffsets(block, boxes)

  // Every half shares one row of shapes, so the first one gives the bottom edge of them all.
  const root = layout.halves[0].rects.root
  const shapeBottom = root.y + root.height + BAND_PAD

  return (
    <View style={{ flexGrow: 1, position: 'relative', width: layout.width }}>
      <View style={{ height: canvasHeight, position: 'relative', width: layout.width }}>
        <Svg
          height={canvasHeight}
          style={{ left: 0, position: 'absolute', top: 0 }}
          viewBox={`0 ${-BAND_PAD} ${layout.width} ${canvasHeight}`}
          width={layout.width}>
          {layout.halves.map((half) => (
            <React.Fragment key={half.id}>{shapeFor(half)}</React.Fragment>
          ))}
          {assignBlockArrows(block).flatMap((entry, entryIndex) => {
            const rects = boxes.get(entry.id)
            if (!rects) return []

            return entry.arrows.flatMap((spec, index) => {
              const start = targetRect(rects, spec.start)
              const end = targetRect(rects, spec.end)
              if (!start || !end) return []

              const { d, head } = buildArrow(spec, start, end, PDF_HEAD_SIZE)

              return [
                <React.Fragment key={`${entry.id}-${entryIndex}-${index}`}>
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
          })}
        </Svg>
        {layout.halves.map((half) => (
          <View
            key={half.id}
            style={{
              height: half.rects.root.height,
              justifyContent: 'center',
              left: half.rects.root.x,
              paddingHorizontal: 3,
              position: 'absolute',
              top: half.rects.root.y + BAND_PAD,
              width: half.rects.root.width,
            }}>
            <Text style={styles.blockLabel}>{half.label}</Text>
          </View>
        ))}
      </View>
      {/*
        Each run is absolute, with both `top` and `bottom` set, so it spans from the shape's own
        bottom edge to the bottom of the row. A `flexGrow` line stops a few points short, and the
        next block's arrow then starts below a visible gap.
      */}
      {offsets.map((offset) => (
        <View
          key={offset}
          style={{
            backgroundColor: COLORS.outline,
            bottom: 0,
            left: offset - PDF_STROKE_WIDTH / 2,
            position: 'absolute',
            top: shapeBottom,
            width: PDF_STROKE_WIDTH,
          }}
        />
      ))}
    </View>
  )
}
