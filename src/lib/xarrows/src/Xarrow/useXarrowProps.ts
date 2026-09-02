import React, { useLayoutEffect, useRef, useState } from 'react'
import {
  anchorCustomPositionType,
  anchorType,
  labelsType,
  pathType,
  svgCustomEdgeType,
  svgEdgeShapeType,
  svgElemType,
  xarrowPropsType,
} from '../types'
import { getElementByPropGiven, getElemPos, xStr2absRelative } from './utils'
import { isArray, isObject } from 'es-toolkit/compat'
import { arrowShapes, cAnchorEdge, cArrowShapes } from '../constants'
import { anchorEdgeType, dimensionType } from '../privateTypes'

const parseLabels = (label: xarrowPropsType['labels']): labelsType => {
  const parsedLabel: labelsType = { start: undefined, middle: undefined, end: undefined }
  if (label) {
    if (typeof label === 'string' || React.isValidElement(label)) parsedLabel.middle = label
    else {
      for (const key in label) {
        parsedLabel[key as keyof labelsType] = (label as labelsType)[key as keyof labelsType]
      }
    }
  }
  return parsedLabel
}

// remove 'auto' as possible anchor from anchorCustomPositionType.position
interface anchorCustomPositionType2 extends Omit<Required<anchorCustomPositionType>, 'position'> {
  position: Exclude<(typeof cAnchorEdge)[number], 'auto'>
}

const parseAnchor = (anchor: anchorType) => {
  // convert to array
  let anchorChoice = isArray(anchor) ? anchor : [anchor]

  //convert to array of objects
  let anchorChoice2 = anchorChoice.map((anchorChoice) => {
    if (typeof anchorChoice === 'string') {
      return { position: anchorChoice }
    } else return anchorChoice
  })

  //remove any invalid anchor names
  anchorChoice2 = anchorChoice2.filter((an) => cAnchorEdge.includes(an.position))
  if (anchorChoice2.length == 0) anchorChoice2 = [{ position: 'auto' }]

  //replace any 'auto' with ['left','right','bottom','top']
  let autosAncs = anchorChoice2.filter((an) => an.position === 'auto')
  if (autosAncs.length > 0) {
    anchorChoice2 = anchorChoice2.filter((an) => an.position !== 'auto')
    anchorChoice2.push(
      ...autosAncs.flatMap((anchorObj) => {
        return (['left', 'right', 'top', 'bottom'] as anchorEdgeType[]).map((anchorName) => {
          return { ...anchorObj, position: anchorName }
        })
      }),
    )
  }

  // default values
  let anchorChoice3 = anchorChoice2.map((anchorChoice) => {
    if (isObject(anchorChoice)) {
      let anchorChoiceCustom = anchorChoice as anchorCustomPositionType
      if (!anchorChoiceCustom.position) anchorChoiceCustom.position = 'auto'
      if (!anchorChoiceCustom.offset) anchorChoiceCustom.offset = { x: 0, y: 0 }
      if (!anchorChoiceCustom.offset.y) anchorChoiceCustom.offset.y = 0
      if (!anchorChoiceCustom.offset.x) anchorChoiceCustom.offset.x = 0
      anchorChoiceCustom = anchorChoiceCustom as Required<anchorCustomPositionType>
      return anchorChoiceCustom
    } else return anchorChoice
  }) as Required<anchorCustomPositionType>[]

  return anchorChoice3 as anchorCustomPositionType2[]
}

type DashnessInput = xarrowPropsType['dashness']
type DashnessObj = Exclude<DashnessInput, boolean | undefined>

const parseDashness = (dashness: DashnessInput, props: { strokeWidth: number }) => {
  let dashStroke = 0,
    dashNone = 0,
    animDashSpeed,
    animDirection = 1
  if (isObject(dashness)) {
    const d = dashness as DashnessObj
    dashStroke = d.strokeLen || props.strokeWidth * 2
    dashNone = d.strokeLen ? (d.nonStrokeLen ?? props.strokeWidth) : props.strokeWidth
    animDashSpeed = d.animation ? d.animation : null
  } else if (typeof dashness === 'boolean' && dashness) {
    dashStroke = props.strokeWidth * 2
    dashNone = props.strokeWidth
    animDashSpeed = null
  }
  return {
    strokeLen: dashStroke,
    nonStrokeLen: dashNone,
    animation: animDashSpeed,
    animDirection,
  } as {
    strokeLen: number
    nonStrokeLen: number
    animation: number
  }
}

const parseEdgeShape = (svgEdge: xarrowPropsType['headShape']): svgCustomEdgeType => {
  if (typeof svgEdge === 'string') {
    if (svgEdge in arrowShapes) svgEdge = arrowShapes[svgEdge as svgEdgeShapeType]
    else {
      console.warn(
        `'${svgEdge}' is not supported arrow shape. the supported arrow shapes is one of ${cArrowShapes}.
           reverting to default shape.`,
      )
      svgEdge = arrowShapes['arrow1']
    }
  }
  svgEdge = svgEdge as svgCustomEdgeType
  if (svgEdge?.offsetForward === undefined) svgEdge.offsetForward = 0.25
  if (svgEdge?.svgElem === undefined) (svgEdge as svgCustomEdgeType).svgElem = null as unknown as svgCustomEdgeType['svgElem']
  // if (svgEdge?.svgProps === undefined) svgEdge.svgProps = arrowShapes.arrow1.svgProps;
  return svgEdge
}

const parseGridBreak = (gridBreak: string): { relative: number; abs: number } => {
  let resGridBreak = xStr2absRelative(gridBreak)
  if (!resGridBreak) resGridBreak = { relative: 0.5, abs: 0 }
  return resGridBreak
}

/**
 * should be wrapped with any changed prop that is affecting the points path positioning
 * @param propVal
 * @param updateRef
 */
const withUpdate = <T>(propVal: T, updateRef: React.MutableRefObject<boolean> | undefined): T => {
  if (updateRef) updateRef.current = true
  return propVal
}

type ParseFunc = (userProp: unknown, propsRefs: Record<string, unknown>, updatePos?: React.MutableRefObject<boolean>) => unknown

const noParse: ParseFunc = (userProp) => userProp
const noParseWithUpdatePos: ParseFunc = (userProp, _, updatePos) => withUpdate(userProp, updatePos)
const parseNumWithUpdatePos: ParseFunc = (userProp, _, updatePos) => withUpdate(Number(userProp), updatePos)
const parseNum: ParseFunc = (userProp) => Number(userProp)

const parsePropsFuncs: Record<keyof xarrowPropsType, ParseFunc> = {
  start: (userProp) => getElementByPropGiven(userProp as xarrowPropsType['start']),
  end: (userProp) => getElementByPropGiven(userProp as xarrowPropsType['end']),
  startAnchor: (userProp, _, updatePos) => withUpdate(parseAnchor(userProp as anchorType), updatePos),
  endAnchor: (userProp, _, updatePos) => withUpdate(parseAnchor(userProp as anchorType), updatePos),
  labels: (userProp) => parseLabels(userProp as xarrowPropsType['labels']),
  color: noParse,
  lineColor: (userProp, propsRefs) => userProp || propsRefs.color,
  headColor: (userProp, propsRefs) => userProp || propsRefs.color,
  tailColor: (userProp, propsRefs) => userProp || propsRefs.color,
  strokeWidth: parseNumWithUpdatePos,
  showHead: noParseWithUpdatePos,
  headSize: parseNumWithUpdatePos,
  showTail: noParseWithUpdatePos,
  tailSize: parseNumWithUpdatePos,
  path: noParseWithUpdatePos,
  curveness: parseNumWithUpdatePos,
  gridBreak: (userProp, _, updatePos) => withUpdate(parseGridBreak(userProp as string), updatePos),
  gridRadius: parseNum,
  tailTransformOffsetX: parseNumWithUpdatePos,
  tailTransformOffsetY: parseNumWithUpdatePos,
  dashness: (userProp, propsRefs) => parseDashness(userProp as DashnessInput, propsRefs as { strokeWidth: number }),
  headShape: (userProp) => parseEdgeShape(userProp as xarrowPropsType['headShape']),
  tailShape: (userProp) => parseEdgeShape(userProp as xarrowPropsType['tailShape']),
  showXarrow: noParse,
  animateDrawing: noParse,
  zIndex: parseNum,
  passProps: noParse,
  arrowBodyProps: noParseWithUpdatePos,
  arrowHeadProps: noParseWithUpdatePos,
  arrowTailProps: noParseWithUpdatePos,
  SVGcanvasProps: noParseWithUpdatePos,
  divContainerProps: noParseWithUpdatePos,
  divContainerStyle: noParseWithUpdatePos,
  SVGcanvasStyle: noParseWithUpdatePos,
  _extendSVGcanvas: noParseWithUpdatePos,
  _debug: noParseWithUpdatePos,
  _cpx1Offset: noParseWithUpdatePos,
  _cpy1Offset: noParseWithUpdatePos,
  _cpx2Offset: noParseWithUpdatePos,
  _cpy2Offset: noParseWithUpdatePos,
}

//build dependencies
const propsDeps: Record<string, string[]> = {}
//each prop depends on himself
for (const propName in parsePropsFuncs) {
  propsDeps[propName] = [propName]
}
// 'lineColor', 'headColor', 'tailColor' props also depends on 'color' prop
for (const propName of ['lineColor', 'headColor', 'tailColor']) {
  propsDeps[propName].push('color')
}

const parseGivenProps = (props: xarrowPropsType, propsRef: Record<string, unknown>): Record<string, unknown> => {
  for (const [name, val] of Object.entries(props)) {
    const fn = parsePropsFuncs[name as keyof xarrowPropsType]
    if (fn) propsRef[name] = fn(val, propsRef)
  }
  return propsRef
}

const defaultProps = {
  start: null as unknown as xarrowPropsType['start'],
  end: null as unknown as xarrowPropsType['end'],
  startAnchor: 'auto' as const,
  endAnchor: 'auto' as const,
  labels: undefined as xarrowPropsType['labels'],
  color: 'CornflowerBlue',
  lineColor: null,
  headColor: null,
  tailColor: null,
  strokeWidth: 4,
  showHead: true,
  headSize: 6,
  showTail: false,
  tailSize: 6,
  path: 'smooth',
  curveness: 0.8,
  gridBreak: '50%',
  gridRadius: 0,
  tailTransformOffsetX: 0,
  tailTransformOffsetY: 0,
  dashness: false,
  headShape: 'arrow1',
  tailShape: 'arrow1',
  showXarrow: true,
  animateDrawing: false,
  zIndex: 0,
  passProps: {},
  arrowBodyProps: {},
  arrowHeadProps: {},
  arrowTailProps: {},
  SVGcanvasProps: {},
  divContainerProps: {},
  divContainerStyle: {},
  SVGcanvasStyle: {},
  _extendSVGcanvas: 0,
  _debug: false,
  _cpx1Offset: 0,
  _cpy1Offset: 0,
  _cpx2Offset: 0,
  _cpy2Offset: 0,
} as const satisfies xarrowPropsType

// The loop in the hook below registers one layout effect per entry, so this list must have a
// constant length. `createParsedProps` seeds every prop with its parsed default, and the loop is
// what applies a caller's value on top. A prop left out here therefore keeps its default forever.
// This project passes only these twelve. The three colour props are derived from `color`.
const observedProps = [
  'start',
  'end',
  'startAnchor',
  'endAnchor',
  'showHead',
  'showTail',
  'color',
  'lineColor',
  'headColor',
  'tailColor',
  'path',
  'strokeWidth',
] as const satisfies readonly (keyof xarrowPropsType)[]

const observedPropsSet: Set<string> = new Set(observedProps)

type parsedXarrowProps = {
  shouldUpdatePosition: React.MutableRefObject<boolean>
  start: HTMLElement
  end: HTMLElement
  startAnchor: anchorCustomPositionType[]
  endAnchor: anchorCustomPositionType[]
  labels: Required<labelsType>
  color: string
  lineColor: string
  headColor: string
  tailColor: string
  strokeWidth: number
  showHead: boolean
  headSize: number
  showTail: boolean
  tailSize: number
  path: pathType
  showXarrow: boolean
  curveness: number
  gridBreak: { relative: number; abs: number }
  gridRadius: number
  tailTransformOffsetX: number
  tailTransformOffsetY: number
  dashness: {
    strokeLen: number
    nonStrokeLen: number
    animation: number
  }
  headShape: svgCustomEdgeType
  tailShape: svgCustomEdgeType
  animateDrawing: number
  zIndex: number
  passProps: React.JSX.IntrinsicElements[svgElemType]
  SVGcanvasProps: React.SVGAttributes<SVGSVGElement>
  arrowBodyProps: React.SVGProps<SVGPathElement>
  arrowHeadProps: React.JSX.IntrinsicElements[svgElemType]
  arrowTailProps: React.JSX.IntrinsicElements[svgElemType]
  divContainerProps: React.HTMLProps<HTMLDivElement>
  SVGcanvasStyle: React.CSSProperties
  divContainerStyle: React.CSSProperties
  _extendSVGcanvas: number
  _debug: boolean
  _cpx1Offset: number
  _cpy1Offset: number
  _cpx2Offset: number
  _cpy2Offset: number
}

// Both of these are per-instance factories, NOT shared constants. The hook below mutates
// `propsRefs` and `valVars` in place before cloning them into state, so a module-level object
// would be written to by every mounting Xarrow — leaving the previous arrow's parsed props
// (and its detached start/end elements) as the starting state of the next one.
const createParsedProps = () =>
  parseGivenProps(defaultProps, {} as Record<string, unknown>) as unknown as parsedXarrowProps

const createValVars = () => ({
  startPos: { x: 0, y: 0, right: 0, bottom: 0 } as dimensionType,
  endPos: { x: 0, y: 0, right: 0, bottom: 0 } as dimensionType,
})

// const parseAllProps = () => parseGivenProps(defaultProps, initialParsedProps);

// A measured rectangle holds four numbers, so an equality check does not need a deep compare.
const samePos = (a: dimensionType, b: dimensionType): boolean =>
  a.x === b.x && a.y === b.y && a.right === b.right && a.bottom === b.bottom

/**
 * smart hook that provides parsed props to Xarrow and will trigger rerender whenever given prop is changed.
 */
const useXarrowProps = (
  userProps: xarrowPropsType,
  refs: { headRef: React.MutableRefObject<any>; tailRef: React.MutableRefObject<any> },
) => {
  const [propsRefs, setPropsRefs] = useState(createParsedProps)
  const shouldUpdatePosition = useRef(false)
  // const _propsRefs = useRef(initialParsedProps);
  // const propsRefs = _propsRefs.current;
  propsRefs['shouldUpdatePosition'] = shouldUpdatePosition
  const curProps = { ...defaultProps, ...userProps }

  // A prop this hook does not observe keeps its default and the caller's value never applies.
  // The failure is silent, so report it in development.
  useLayoutEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    for (const propName of Object.keys(userProps)) {
      if (!(propName in parsePropsFuncs)) continue
      if (observedPropsSet.has(propName)) continue
      console.warn(
        `[xarrow] the prop "${propName}" is not in observedProps, so its value is ignored. Add it to that list.`,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProps])

  // react states the number of hooks per render must stay constant,
  // this is ok we are using these hooks in a loop, because the number of props in observedProps is constant,
  // so the number of hook we will fire each render will always be the same.

  // update the value of the ref that represents the corresponding prop
  // for example: if given 'start' prop would change call getElementByPropGiven(props.start) and save value into propsRefs.start.current
  // why to save refs to props parsed values? some of the props require relatively expensive computations(like 'start' and 'startAnchor').
  // this will always run in the same order and THAT'S WAY ITS LEGAL
  for (const propName of observedProps as readonly (keyof xarrowPropsType)[]) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(
      () => {
        const fn = parsePropsFuncs[propName]
        if (fn) {
          ;(propsRefs as Record<string, unknown>)[propName] = fn(
            curProps[propName],
            propsRefs as Record<string, unknown>,
            shouldUpdatePosition,
          )
        }
        // console.log('prop update:', propName, 'with value', propsRefs[propName]);
        setPropsRefs({ ...propsRefs })
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      propsDeps[propName].map((name) => userProps[name as keyof xarrowPropsType]),
    )
  }

  // rerender whenever position of start element or end element changes
  const [valVars, setValVars] = useState(createValVars)

  // The two measurements run after the commit, never in the render body. A read during render
  // forces a layout pass for every arrow on every render, including a render that moved nothing.
  // The in-place write stays: Xarrow's own layout effect reads valVars later in this same commit.
  useLayoutEffect(() => {
    const startPos = getElemPos(propsRefs.start)
    const endPos = getElemPos(propsRefs.end)
    if (samePos(valVars.startPos, startPos) && samePos(valVars.endPos, endPos)) return
    valVars.startPos = startPos
    valVars.endPos = endPos
    shouldUpdatePosition.current = true
    setValVars({ ...valVars })
  })

  useLayoutEffect(() => {
    // console.log('svg shape changed!');
    shouldUpdatePosition.current = true
    setValVars({ ...valVars })
  }, [propsRefs.headShape.svgElem, propsRefs.tailShape.svgElem])

  return [propsRefs, valVars] as const
}

export type useXarrowPropsResType = ReturnType<typeof useXarrowProps>
export default useXarrowProps
