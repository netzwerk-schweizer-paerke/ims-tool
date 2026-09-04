import { Path, Svg, View } from '@react-pdf/renderer'
import React from 'react'

import { ARROW_HEAD_PATH } from '@/components/graph/fields/graph/lib/arrow-geometry'
import {
  COLORS,
  PANEL_ARROW_WIDTH,
  PDF_HEAD_SIZE,
  PDF_STROKE_WIDTH,
  styles,
} from '@/components/pdf/theme'

const TIP = PANEL_ARROW_WIDTH - PDF_HEAD_SIZE - 2
const AXIS = PDF_HEAD_SIZE

/**
 * The arrow between two panels of an activity block.
 *
 * The screen draws a chevron between the input, the tasks and the output. This reuses the head
 * the graph already draws, so both surfaces carry one arrow shape.
 */
export const PanelArrow = () => (
  <View style={styles.activityArrow}>
    <Svg height={PDF_HEAD_SIZE * 2} width={PANEL_ARROW_WIDTH}>
      <Path
        d={`M 2 ${AXIS} L ${TIP} ${AXIS}`}
        stroke={COLORS.outline}
        strokeWidth={PDF_STROKE_WIDTH}
      />
      <Path
        d={ARROW_HEAD_PATH}
        fill={COLORS.outline}
        transform={`translate(${TIP} ${AXIS - PDF_HEAD_SIZE / 2}) scale(${PDF_HEAD_SIZE})`}
      />
    </Svg>
  </View>
)
