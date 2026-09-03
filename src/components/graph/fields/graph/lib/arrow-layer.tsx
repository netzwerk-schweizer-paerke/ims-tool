'use client'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'

import {
  ARROW_HEAD_PATH,
  ARROW_STROKE_WIDTH,
  ArrowSpec,
  buildArrow,
  Rect,
} from '@/components/graph/fields/graph/lib/arrow-geometry'

/**
 * One arrow of a layer. Here `start` and `end` hold full element ids, not target names.
 * The caller has already joined the block's id prefix to the name.
 */
export type LayerArrow = ArrowSpec & { key: string }

type Props = {
  /** Must be referentially stable. The measurement pass re-runs whenever it changes. */
  arrows: LayerArrow[]
}

const EMPTY_RECTS: Map<string, Rect> = new Map()

// The edit side builds its ids from React's `useId()`, which returns a value such as `«r0»`.
// That is not a valid CSS identifier, so `querySelector` would need escaping to find it.
// `getElementById` takes the id literally.
// eslint-disable-next-line unicorn/prefer-query-selector
const elementById = (id: string) => document.getElementById(id)

const sameRect = (a: Rect, b: Rect) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

const sameRects = (a: Map<string, Rect>, b: Map<string, Rect>) => {
  if (a.size !== b.size) return false
  for (const [id, rect] of a) {
    const other = b.get(id)
    if (!other || !sameRect(rect, other)) return false
  }
  return true
}

/**
 * Draws every arrow of one block or one flow row into a single SVG.
 *
 * The layer measures each referenced target once per layout pass, in coordinates relative to
 * itself, and hands those rectangles to a pure geometry function. The engine this replaced
 * measured its two endpoints inside every arrow, on every render.
 */
export const ArrowLayer = ({ arrows }: Props) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [rects, setRects] = useState(EMPTY_RECTS)

  useLayoutEffect(() => {
    const layer = svgRef.current
    if (!layer) return

    const ids = new Set<string>()
    for (const arrow of arrows) {
      ids.add(arrow.start)
      ids.add(arrow.end)
    }

    let frame: null | number = null

    // The layer is `inset: 0` inside its positioned parent, so its border box is the
    // coordinate space the SVG user units already use.
    const measure = () => {
      const origin = layer.getBoundingClientRect()
      const next = new Map<string, Rect>()
      for (const id of ids) {
        const element = elementById(id)
        if (!element) continue
        const box = element.getBoundingClientRect()
        next.set(id, {
          height: box.height,
          width: box.width,
          x: box.left - origin.left,
          y: box.top - origin.top,
        })
      }
      setRects((previous) => (sameRects(previous, next) ? previous : next))
      return next.size === ids.size
    }

    // A target that the same commit renders is already in the document. A target that is
    // not costs one extra frame rather than an arrow that never draws.
    if (!measure()) {
      frame = requestAnimationFrame(() => {
        frame = null
        measure()
      })
    }

    const observer = new ResizeObserver(() => measure())
    // The parent is the plain block-level box. An outer SVG reports its size less
    // reliably, so watch both rather than the SVG alone.
    if (layer.parentElement) observer.observe(layer.parentElement)
    observer.observe(layer)
    for (const id of ids) {
      const element = elementById(id)
      if (element) observer.observe(element)
    }

    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [arrows])

  const geometries = useMemo(
    () =>
      arrows.flatMap((arrow) => {
        const startRect = rects.get(arrow.start)
        const endRect = rects.get(arrow.end)
        // A stored connection can name a target this block does not render. Skip it.
        if (!startRect || !endRect) return []
        return [{ geometry: buildArrow(arrow, startRect, endRect), key: arrow.key }]
      }),
    [arrows, rects],
  )

  return (
    <svg
      ref={svgRef}
      style={{
        inset: 0,
        // The outer targets sit 4px outside the layer, so their coordinates go negative.
        overflow: 'visible',
        pointerEvents: 'none',
        position: 'absolute',
      }}>
      {geometries.map(({ geometry, key }) => (
        <path d={geometry.d} fill="transparent" key={key} strokeWidth={ARROW_STROKE_WIDTH} />
      ))}
      {geometries.map(({ geometry, key }) =>
        geometry.head ? (
          <g
            key={key}
            transform={`translate(${geometry.head.x},${geometry.head.y}) rotate(${geometry.head.orient}) scale(${geometry.head.scale})`}>
            <path d={ARROW_HEAD_PATH} />
          </g>
        ) : null,
      )}
    </svg>
  )
}
