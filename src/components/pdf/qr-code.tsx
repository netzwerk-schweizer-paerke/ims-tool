import { Rect, Svg } from '@react-pdf/renderer'
import React from 'react'

import { qrMatrix } from '@/components/pdf/lib/qr-modules'
import { COLORS } from '@/components/pdf/theme'

/** A QR code needs four light modules around it, or a scanner cannot find its edges. */
const QUIET_ZONE = 4

type Props = {
  /** The drawn edge length in points. */
  size?: number
  value: string
}

/**
 * Draws the code as vector rectangles, so it stays sharp at any zoom and at any print size.
 * The viewBox carries the quiet zone, so the caller only picks the edge length.
 */
export const QrCode = ({ size = 44, value }: Props) => {
  const { runs, size: modules } = qrMatrix(value)
  const extent = modules + QUIET_ZONE * 2

  return (
    <Svg
      height={size}
      viewBox={`${-QUIET_ZONE} ${-QUIET_ZONE} ${extent} ${extent}`}
      width={size}>
      {runs.map((run) => (
        <Rect
          fill={COLORS.text}
          height={1}
          key={`${run.y}-${run.x}`}
          width={run.length}
          x={run.x}
          y={run.y}
        />
      ))}
    </Svg>
  )
}
