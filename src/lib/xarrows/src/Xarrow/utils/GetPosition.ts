import { useXarrowPropsResType } from '../useXarrowProps'
import React from 'react'
import { calcAnchors } from '../anchors'
import { getShortestLine, getSvgPos } from './index'
import { cPaths } from '../../constants'
import { buzzierMinSols, bzFunction } from './buzzier'
import { anchorCustomPositionType, pathType } from '../../types'

type Point = { x: number; y: number }

type AnchorPoint = { x: number; y: number; anchor: anchorCustomPositionType }

type CurvePossibilities = {
  [key: string]: () => void
}

// Module-level helper for anchor direction - optimized with direct equality checks
const getAnchorDir = (pos: string): string => {
  if (pos === 'left' || pos === 'right') return 'h'
  if (pos === 'bottom' || pos === 'top') return 'v'
  if (pos === 'middle') return 'm'
  return ''
}

const getRoundedEdge = (
  gridRadius: number,
  start: Point,
  corner: Point,
  end: Point,
): string => {
  let cornerStartXOffset = 0
  let cornerStartYOffset = 0
  let cornerEndXOffset = 0
  let cornerEndYOffset = 0

  if (corner.x === start.x) {
    // line up/down then left/right
    cornerStartYOffset = corner.y > start.y ? -gridRadius : gridRadius
    cornerEndXOffset = end.x > start.x ? gridRadius : -gridRadius
  } else if (corner.y === start.y) {
    // line left/right then up/down
    cornerStartXOffset = corner.x > start.x ? -gridRadius : gridRadius
    cornerEndYOffset = end.y > start.y ? gridRadius : -gridRadius
  }

  return (
    `L ${corner.x + cornerStartXOffset} ${corner.y + cornerStartYOffset} ` +
    `Q ${corner.x} ${corner.y} ${corner.x + cornerEndXOffset} ${corner.y + cornerEndYOffset}`
  )
}

export type PositionResult = {
  cx0: number
  cy0: number
  x1: number
  x2: number
  y1: number
  y2: number
  cw: number
  ch: number
  cpx1: number
  cpy1: number
  cpx2: number
  cpy2: number
  dx: number
  dy: number
  absDx: number
  absDy: number
  headOrient: number
  tailOrient: number
  labelStartPos: Point
  labelMiddlePos: Point
  labelEndPos: Point
  excLeft: number
  excRight: number
  excUp: number
  excDown: number
  headOffset: number
  arrowHeadOffset: Point
  arrowTailOffset: Point
  startPoints: AnchorPoint[]
  endPoints: AnchorPoint[]
  mainDivPos: Point
  xSign: number
  ySign: number
  lineLength: number
  fHeadSize: number
  fTailSize: number
  arrowPath: string
}

/**
 * The Main logic of path calculation for the arrow.
 * calculate new path, adjusting canvas, and set state based on given properties.
 * */
export const getPosition = (
  xProps: useXarrowPropsResType,
  mainRef: React.MutableRefObject<{
    svgRef: React.MutableRefObject<SVGSVGElement | null>
    lineRef: React.MutableRefObject<SVGPathElement | null>
  }>,
): PositionResult => {
  const [propsRefs, valVars] = xProps
  const {
    startAnchor,
    endAnchor,
    strokeWidth,
    showHead,
    headSize,
    showTail,
    tailSize,
    path: pathProp,
    curveness,
    gridBreak,
    headShape,
    gridRadius,
    tailTransformOffsetX,
    tailTransformOffsetY,
    tailShape,
    _extendSVGcanvas,
    _cpx1Offset,
    _cpy1Offset,
    _cpx2Offset,
    _cpy2Offset,
  } = propsRefs
  const { startPos, endPos } = valVars
  const { svgRef, lineRef } = mainRef.current

  let headOrient: number = 0
  let tailOrient: number = 0

  // convert startAnchor and endAnchor to list of objects represents allowed anchors.
  const startPoints = calcAnchors(startAnchor, startPos)
  const endPoints = calcAnchors(endAnchor, endPos)

  // choose the smallest path for 2 points from these possibilities.
  const { chosenStart, chosenEnd } = getShortestLine(startPoints, endPoints)

  const startAnchorPosition = chosenStart.anchor.position
  let endAnchorPosition = chosenEnd.anchor.position
  const startPoint = { x: chosenStart.x, y: chosenStart.y }
  const endPoint = { x: chosenEnd.x, y: chosenEnd.y }

  const mainDivPos = getSvgPos(svgRef)
  const dx = endPoint.x - startPoint.x
  const dy = endPoint.y - startPoint.y
  const absDx = Math.abs(endPoint.x - startPoint.x)
  const absDy = Math.abs(endPoint.y - startPoint.y)
  const xSign = dx > 0 ? 1 : -1
  const ySign = dy > 0 ? 1 : -1
  const headOffset = headShape.offsetForward as number
  const tailOffset = tailShape.offsetForward as number
  const fHeadSize = headSize * strokeWidth // factored head size
  const fTailSize = tailSize * strokeWidth // factored tail size

  // These get modified during canvas adjustments
  let cx0 = Math.min(startPoint.x, endPoint.x) - mainDivPos.x
  let cy0 = Math.min(startPoint.y, endPoint.y) - mainDivPos.y

  // const { current: _headBox } = headBox;
  let xHeadOffset = 0
  let yHeadOffset = 0
  let xTailOffset = 0
  let yTailOffset = 0

  const _headOffset = fHeadSize * headOffset
  const _tailOffset = fTailSize * tailOffset

  // Normalize path - default to 'smooth', treat 'straight' as smooth with no curveness
  const path = (!cPaths.includes(pathProp as typeof cPaths[number]) || pathProp === 'straight')
    ? 'smooth'
    : pathProp
  const cu = pathProp === 'straight' ? 0 : Number(curveness)

  const biggerSide = headSize > tailSize ? headSize : tailSize
  const _calc = strokeWidth + (strokeWidth * biggerSide) / 2
  const extendCanvas = Number(_extendSVGcanvas)
  let excRight = _calc + extendCanvas
  let excLeft = _calc + extendCanvas
  let excUp = _calc + extendCanvas
  let excDown = _calc + extendCanvas

  ////////////////////////////////////
  // arrow point to point calculations
  let x1 = 0,
    x2 = absDx,
    y1 = 0,
    y2 = absDy
  if (dx < 0) [x1, x2] = [x2, x1]
  if (dy < 0) [y1, y2] = [y2, y1]

  ////////////////////////////////////
  // arrow curviness and arrowhead placement calculations

  if (cu === 0) {
    // in case of straight path
    let headAngel = Math.atan(absDy / absDx)

    if (showHead) {
      x2 -= fHeadSize * (1 - headOffset) * xSign * Math.cos(headAngel)
      y2 -= fHeadSize * (1 - headOffset) * ySign * Math.sin(headAngel)

      headAngel *= ySign
      if (xSign < 0) headAngel = (Math.PI - headAngel * xSign) * xSign
      xHeadOffset = Math.cos(headAngel) * _headOffset - (Math.sin(headAngel) * fHeadSize) / 2
      yHeadOffset = (Math.cos(headAngel) * fHeadSize) / 2 + Math.sin(headAngel) * _headOffset
      headOrient = (headAngel * 180) / Math.PI
    }

    let tailAngel = Math.atan(absDy / absDx)
    if (showTail) {
      x1 += fTailSize * (1 - tailOffset) * xSign * Math.cos(tailAngel)
      y1 += fTailSize * (1 - tailOffset) * ySign * Math.sin(tailAngel)
      tailAngel *= -ySign
      if (xSign > 0) tailAngel = (Math.PI - tailAngel * xSign) * xSign
      xTailOffset = Math.cos(tailAngel) * _tailOffset - (Math.sin(tailAngel) * fTailSize) / 2
      yTailOffset = (Math.cos(tailAngel) * fTailSize) / 2 + Math.sin(tailAngel) * _tailOffset
      tailOrient = (tailAngel * 180) / Math.PI
    }
  } else {
    // in case of smooth path
    if (endAnchorPosition === 'middle') {
      // in case a middle anchor is chosen for endAnchor choose from which side to attach to the middle of the element
      if (absDx > absDy) {
        endAnchorPosition = xSign ? 'left' : 'right'
      } else {
        endAnchorPosition = ySign ? 'top' : 'bottom'
      }
    }
    if (showHead) {
      if (['left', 'right'].includes(endAnchorPosition)) {
        xHeadOffset += _headOffset * xSign
        x2 -= fHeadSize * (1 - headOffset) * xSign //same!
        yHeadOffset += (fHeadSize * xSign) / 2
        if (endAnchorPosition === 'left') {
          headOrient = 0
          if (xSign < 0) headOrient += 180
        } else {
          headOrient = 180
          if (xSign > 0) headOrient += 180
        }
      } else if (['top', 'bottom'].includes(endAnchorPosition)) {
        xHeadOffset += (fHeadSize * -ySign) / 2
        yHeadOffset += _headOffset * ySign
        y2 -= fHeadSize * ySign - yHeadOffset
        if (endAnchorPosition === 'top') {
          headOrient = 270
          if (ySign > 0) headOrient += 180
        } else {
          headOrient = 90
          if (ySign < 0) headOrient += 180
        }
      }
    }
  }

  if (showTail && cu !== 0) {
    if (['left', 'right'].includes(startAnchorPosition)) {
      xTailOffset += _tailOffset * -xSign
      x1 += fTailSize * xSign + xTailOffset
      yTailOffset += -(fTailSize * xSign) / 2
      if (startAnchorPosition === 'left') {
        tailOrient = 180
        if (xSign < 0) tailOrient += 180
      } else {
        tailOrient = 0
        if (xSign > 0) tailOrient += 180
      }
    } else if (['top', 'bottom'].includes(startAnchorPosition)) {
      yTailOffset += _tailOffset * -ySign
      y1 += fTailSize * ySign + yTailOffset
      xTailOffset += (fTailSize * ySign) / 2
      if (startAnchorPosition === 'top') {
        tailOrient = 90
        if (ySign > 0) tailOrient += 180
      } else {
        tailOrient = 270
        if (ySign < 0) tailOrient += 180
      }
    }
  }

  const arrowHeadOffset = { x: xHeadOffset, y: yHeadOffset }
  const arrowTailOffset = { x: xTailOffset, y: yTailOffset }

  let cpx1 = x1,
    cpy1 = y1,
    cpx2 = x2,
    cpy2 = y2

  let curvesPossibilities: CurvePossibilities = {}
  if (path === 'smooth')
    curvesPossibilities = {
      hh: () => {
        //horizontal - from right to left or the opposite
        cpx1 += absDx * cu * xSign
        cpx2 -= absDx * cu * xSign
      },
      vv: () => {
        //vertical - from top to bottom or opposite
        cpy1 += absDy * cu * ySign
        cpy2 -= absDy * cu * ySign
      },
      hv: () => {
        // start horizontally then vertically
        // from v side to h side
        cpx1 += absDx * cu * xSign
        cpy2 -= absDy * cu * ySign
      },
      vh: () => {
        // start vertically then horizontally
        // from h side to v side
        cpy1 += absDy * cu * ySign
        cpx2 -= absDx * cu * xSign
      },
    }
  else if (path === 'grid') {
    curvesPossibilities = {
      hh: () => {
        cpx1 += (absDx * gridBreak.relative + gridBreak.abs) * xSign
        cpx2 -= (absDx * (1 - gridBreak.relative) - gridBreak.abs) * xSign
        if (showHead) {
          cpx1 -= ((fHeadSize * (1 - headOffset)) / 2) * xSign
          cpx2 += ((fHeadSize * (1 - headOffset)) / 2) * xSign
        }
        if (showTail) {
          cpx1 -= ((fTailSize * (1 - tailOffset)) / 2) * xSign
          cpx2 += ((fTailSize * (1 - tailOffset)) / 2) * xSign
        }
      },
      vv: () => {
        cpy1 += (absDy * gridBreak.relative + gridBreak.abs) * ySign
        cpy2 -= (absDy * (1 - gridBreak.relative) - gridBreak.abs) * ySign
        if (showHead) {
          cpy1 -= ((fHeadSize * (1 - headOffset)) / 2) * ySign
          cpy2 += ((fHeadSize * (1 - headOffset)) / 2) * ySign
        }
        if (showTail) {
          cpy1 -= ((fTailSize * (1 - tailOffset)) / 2) * ySign
          cpy2 += ((fTailSize * (1 - tailOffset)) / 2) * ySign
        }
      },
      hv: () => {
        cpx1 = x2
      },
      vh: () => {
        cpy1 = y2
      },
    }
  }
  // smart select best curve for the current anchors
  const startDir = getAnchorDir(startAnchorPosition)
  const endDir = getAnchorDir(endAnchorPosition)
  const rawCurviness = startDir + endDir
  const selectedCurviness = absDx > absDy
    ? rawCurviness.replace(/m/g, 'h')
    : rawCurviness.replace(/m/g, 'v')
  curvesPossibilities[selectedCurviness]?.()

  cpx1 += _cpx1Offset
  cpy1 += _cpy1Offset
  cpx2 += _cpx2Offset
  cpy2 += _cpy2Offset

  ////////////////////////////////////
  // canvas smart size adjustments
  const [xSol1, xSol2] = buzzierMinSols(x1, cpx1, cpx2, x2)
  const [ySol1, ySol2] = buzzierMinSols(y1, cpy1, cpy2, y2)
  if (xSol1 < 0) excLeft += -xSol1
  if (xSol2 > absDx) excRight += xSol2 - absDx
  if (ySol1 < 0) excUp += -ySol1
  if (ySol2 > absDy) excDown += ySol2 - absDy

  if (path === 'grid') {
    excLeft += _calc
    excRight += _calc
    excUp += _calc
    excDown += _calc
  }

  x1 += excLeft
  x2 += excLeft
  y1 += excUp
  y2 += excUp
  cpx1 += excLeft
  cpx2 += excLeft
  cpy1 += excUp
  cpy2 += excUp

  const cw = absDx + excLeft + excRight,
    ch = absDy + excUp + excDown
  cx0 -= excLeft
  cy0 -= excUp

  //labels
  const bzx = bzFunction(x1, cpx1, cpx2, x2)
  const bzy = bzFunction(y1, cpy1, cpy2, y2)
  const labelStartPos = { x: bzx(0.01), y: bzy(0.01) }
  const labelMiddlePos = { x: bzx(0.5), y: bzy(0.5) }
  const labelEndPos = { x: bzx(0.99), y: bzy(0.99) }

  const arrowPath = ((): string => {
    if (path === 'grid') {
      if (gridRadius && !(cpx1 === cpx2 && cpy1 === cpy2)) {
        if (x2 === cpx2 && y2 === cpy2) {
          // 2 lines, 1 corner
          const roundedEdge = getRoundedEdge(
            gridRadius,
            { x: x1, y: y1 },
            { x: cpx1, y: cpy1 },
            { x: x2, y: y2 },
          )
          return `M ${x1} ${y1} ${roundedEdge} L ${x2} ${y2}`
        } else {
          // 3 lines, 2 corners
          const roundedEdge1 = getRoundedEdge(
            gridRadius,
            { x: x1, y: y1 },
            { x: cpx1, y: cpy1 },
            { x: cpx2, y: cpy2 },
          )
          const roundedEdge2 = getRoundedEdge(
            gridRadius,
            { x: cpx1, y: cpy1 },
            { x: cpx2, y: cpy2 },
            { x: x2, y: y2 },
          )
          return `M ${x1} ${y1} ${roundedEdge1} ${roundedEdge2} L ${x2} ${y2}`
        }
      }
      return `M ${x1} ${y1} L  ${cpx1} ${cpy1} L ${cpx2} ${cpy2} ${x2} ${y2}`
    }
    // smooth path
    return `M ${x1} ${y1} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${x2} ${y2}`
  })()
  return {
    cx0,
    cy0,
    x1,
    x2,
    y1,
    y2,
    cw,
    ch,
    cpx1,
    cpy1,
    cpx2,
    cpy2,
    dx,
    dy,
    absDx,
    absDy,
    headOrient,
    tailOrient,
    labelStartPos,
    labelMiddlePos,
    labelEndPos,
    excLeft,
    excRight,
    excUp,
    excDown,
    headOffset: _headOffset,
    arrowHeadOffset,
    arrowTailOffset: {
      x: arrowTailOffset.x + tailTransformOffsetX,
      y: arrowTailOffset.y + tailTransformOffsetY,
    },
    startPoints,
    endPoints,
    mainDivPos,
    xSign,
    ySign,
    lineLength: lineRef.current?.getTotalLength() ?? 0,
    fHeadSize,
    fTailSize,
    arrowPath,
  }
}
