'use client'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { xarrowPropsType } from '../types'
import useXarrowProps from './useXarrowProps'
import { getPosition, PositionResult } from './utils/GetPosition'

// Extended type for SVG animation elements that support beginElement
interface SVGAnimationElement extends SVGElement {
  beginElement(): void
}

const Xarrow: React.FC<xarrowPropsType> = (props: xarrowPropsType) => {
  const mainRef = useRef({
    svgRef: useRef<SVGSVGElement>(null),
    lineRef: useRef<SVGPathElement>(null),
    headRef: useRef<SVGGElement>(null),
    tailRef: useRef<SVGGElement>(null),
    lineDrawAnimRef: useRef<SVGAnimationElement>(null),
    lineDashAnimRef: useRef<SVGAnimationElement>(null),
    headOpacityAnimRef: useRef<SVGAnimationElement>(null),
  })
  const {
    svgRef,
    lineRef,
    headRef,
    tailRef,
    lineDrawAnimRef,
    lineDashAnimRef,
    headOpacityAnimRef,
  } = mainRef.current

  const xProps = useXarrowProps(props, mainRef.current)
  const [propsRefs] = xProps

  const {
    labels,
    lineColor,
    headColor,
    tailColor,
    strokeWidth,
    showHead,
    showTail,
    dashness,
    headShape,
    tailShape,
    showXarrow,
    zIndex,
    passProps,
    arrowBodyProps,
    arrowHeadProps,
    arrowTailProps,
    SVGcanvasProps,
    divContainerProps,
    divContainerStyle,
    SVGcanvasStyle,
    _debug,
    shouldUpdatePosition,
  } = propsRefs

  // Use prop directly instead of mutating destructured value
  const animateDrawingValue = props.animateDrawing as number | boolean | undefined
  const [drawAnimEnded, setDrawAnimEnded] = useState(!animateDrawingValue)

  const [, setRender] = useState({})
  const forceRerender = () => setRender({})

  const [st, setSt] = useState<PositionResult>({
    //initial state
    cx0: 0, //x start position of the canvas
    cy0: 0, //y start position of the canvas
    cw: 0, // the canvas width
    ch: 0, // the canvas height
    x1: 0, //the x starting point of the line inside the canvas
    y1: 0, //the y starting point of the line inside the canvas
    x2: 0, //the x ending point of the line inside the canvas
    y2: 0, //the y ending point of the line inside the canvas
    dx: 0, // the x difference between 'start' anchor to 'end' anchor
    dy: 0, // the y difference between 'start' anchor to 'end' anchor
    absDx: 0, // the x length(positive) difference
    absDy: 0, // the y length(positive) difference
    cpx1: 0, // control points - control the curviness of the line
    cpy1: 0,
    cpx2: 0,
    cpy2: 0,
    headOrient: 0, // determines to what side the arrowhead will point
    tailOrient: 0, // determines to what side the arrow tail will point
    arrowHeadOffset: { x: 0, y: 0 },
    arrowTailOffset: { x: 0, y: 0 },
    headOffset: 0,
    excRight: 0, //expand canvas to the right
    excLeft: 0, //expand canvas to the left
    excUp: 0, //expand canvas upwards
    excDown: 0, // expand canvas downward
    startPoints: [],
    endPoints: [],
    mainDivPos: { x: 0, y: 0 },
    xSign: 1,
    ySign: 1,
    lineLength: 0,
    fHeadSize: 1,
    fTailSize: 1,
    arrowPath: ``,
    labelStartPos: { x: 0, y: 0 },
    labelMiddlePos: { x: 0, y: 0 },
    labelEndPos: { x: 0, y: 0 },
  })

  /**
   * The Main logic of path calculation for the arrow.
   * calculate new path, adjusting canvas, and set state based on given properties.
   * */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (shouldUpdatePosition.current) {
      const pos = getPosition(xProps, mainRef)
      setSt(pos)
      shouldUpdatePosition.current = false
    }
  })

  // log('st', st);

  const xOffsetHead = st.x2 - st.arrowHeadOffset.x
  const yOffsetHead = st.y2 - st.arrowHeadOffset.y
  const xOffsetTail = st.x1 - st.arrowTailOffset.x
  const yOffsetTail = st.y1 - st.arrowTailOffset.y

  // Compute animation values immutably
  const dashoffset = dashness.strokeLen + dashness.nonStrokeLen
  const animDirection = dashness.animation < 0 ? -1 : 1
  const normalizedDashnessAnimation = Math.abs(dashness.animation)

  const animationConfig = (() => {
    if (animateDrawingValue && !drawAnimEnded) {
      const animValue = typeof animateDrawingValue === 'boolean' ? 1 : animateDrawingValue
      const isReverse = animValue < 0
      return {
        dashArray: st.lineLength,
        animation: `${Math.abs(animValue)}s`,
        animStartValue: isReverse ? 0 : st.lineLength,
        animEndValue: isReverse ? st.lineLength : 0,
        animRepeatCount: 1 as number | 'indefinite',
      }
    }
    return {
      dashArray: `${dashness.strokeLen} ${dashness.nonStrokeLen}`,
      animation: `${1 / normalizedDashnessAnimation}s`,
      animStartValue: dashoffset * animDirection,
      animEndValue: 0,
      animRepeatCount: 'indefinite' as number | 'indefinite',
    }
  })()

  const { dashArray, animation, animStartValue, animEndValue, animRepeatCount } = animationConfig

  // handle draw animation - update line length when path changes
  useLayoutEffect(() => {
    if (lineRef.current) {
      const length = lineRef.current.getTotalLength()
      setSt((prevSt) => ({ ...prevSt, lineLength: length }))
    }
  }, [st.arrowPath])

  // set all props on first render
  useEffect(() => {
    const monitorDOMchanges = () => {
      window.addEventListener('resize', forceRerender)

      const handleDrawAmimEnd = () => {
        setDrawAnimEnded(true)
        headOpacityAnimRef.current?.beginElement()
        lineDashAnimRef.current?.beginElement()
      }
      const handleDrawAmimBegin = () => {
        if (headRef.current) headRef.current.style.opacity = '0'
      }
      if (lineDrawAnimRef.current && headRef.current) {
        lineDrawAnimRef.current.addEventListener('endEvent', handleDrawAmimEnd)
        lineDrawAnimRef.current.addEventListener('beginEvent', handleDrawAmimBegin)
      }
      return () => {
        window.removeEventListener('resize', forceRerender)
        if (lineDrawAnimRef.current) {
          lineDrawAnimRef.current.removeEventListener('endEvent', handleDrawAmimEnd)
          if (headRef.current)
            lineDrawAnimRef.current.removeEventListener('beginEvent', handleDrawAmimBegin)
        }
      }
    }

    const cleanMonitorDOMchanges = monitorDOMchanges()
    return () => {
      setDrawAnimEnded(false)
      cleanMonitorDOMchanges()
    }
  }, [showXarrow])

  // Watch for size changes on start/end elements AND their positioned parents using ResizeObserver
  // This is needed because absolutely positioned elements don't resize, but their parents do
  useEffect(() => {
    const startEl = propsRefs.start
    const endEl = propsRefs.end
    if (!startEl && !endEl) return

    const resizeObserver = new ResizeObserver(() => {
      shouldUpdatePosition.current = true
      forceRerender()
    })

    // Find positioned parent (the element that actually resizes)
    const getPositionedParent = (el: HTMLElement | null): HTMLElement | null => {
      if (!el) return null
      let parent = el.parentElement
      while (parent) {
        const position = getComputedStyle(parent).position
        if (position === 'relative' || position === 'absolute' || position === 'fixed') {
          return parent
        }
        parent = parent.parentElement
      }
      return null
    }

    const elementsToObserve = new Set<HTMLElement>()

    if (startEl) {
      elementsToObserve.add(startEl)
      const startParent = getPositionedParent(startEl)
      if (startParent) elementsToObserve.add(startParent)
    }
    if (endEl) {
      elementsToObserve.add(endEl)
      const endParent = getPositionedParent(endEl)
      if (endParent) elementsToObserve.add(endParent)
    }

    elementsToObserve.forEach((el) => resizeObserver.observe(el))

    return () => {
      resizeObserver.disconnect()
    }
  }, [propsRefs.start, propsRefs.end, shouldUpdatePosition])

  // passProps is spread onto SVG elements - cast to SVGAttributes for type compatibility
  const svgPassProps = passProps as React.SVGAttributes<SVGElement>

  return (
    <div {...divContainerProps} style={{ position: 'absolute', zIndex, ...divContainerStyle }}>
      {showXarrow ? (
        <>
          <svg
            ref={svgRef}
            width={st.cw}
            height={st.ch}
            style={{
              position: 'absolute',
              left: st.cx0,
              top: st.cy0,
              pointerEvents: 'none',
              border: _debug ? '1px dashed yellow' : undefined,
              ...SVGcanvasStyle,
            }}
            overflow="auto"
            {...SVGcanvasProps}>
            {/* body of the arrow */}
            <path
              ref={lineRef}
              d={st.arrowPath}
              stroke={lineColor}
              strokeDasharray={dashArray}
              // strokeDasharray={'0 0'}
              strokeWidth={strokeWidth}
              fill="transparent"
              pointerEvents="visibleStroke"
              {...svgPassProps}
              {...arrowBodyProps}>
              <>
                {drawAnimEnded ? (
                  <>
                    {/* moving dashed line animation */}
                    {normalizedDashnessAnimation ? (
                      <animate
                        ref={lineDashAnimRef}
                        attributeName="stroke-dashoffset"
                        values={`${dashoffset * animDirection};0`}
                        dur={`${1 / normalizedDashnessAnimation}s`}
                        repeatCount="indefinite"
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    {/* the creation of the line animation */}
                    {animateDrawingValue ? (
                      <animate
                        ref={lineDrawAnimRef}
                        id={`svgEndAnimate`}
                        attributeName="stroke-dashoffset"
                        values={`${animStartValue};${animEndValue}`}
                        dur={animation}
                        repeatCount={animRepeatCount}
                      />
                    ) : null}
                  </>
                )}
              </>
            </path>
            {/* arrow tail */}
            {showTail ? (
              <g
                fill={tailColor}
                pointerEvents="auto"
                transform={`translate(${xOffsetTail},${yOffsetTail}) rotate(${st.tailOrient}) scale(${st.fTailSize})`}
                {...svgPassProps}
                {...(arrowTailProps as React.SVGAttributes<SVGGElement>)}>
                {tailShape.svgElem}
              </g>
            ) : null}

            {/* head of the arrow */}
            {showHead ? (
              <g
                ref={headRef}
                fill={headColor}
                pointerEvents="auto"
                transform={`translate(${xOffsetHead},${yOffsetHead}) rotate(${st.headOrient}) scale(${st.fHeadSize})`}
                opacity={animateDrawingValue && !drawAnimEnded ? 0 : 1}
                {...svgPassProps}
                {...(arrowHeadProps as React.SVGAttributes<SVGGElement>)}>
                <animate
                  ref={headOpacityAnimRef}
                  dur={'0.4'}
                  attributeName="opacity"
                  from="0"
                  to="1"
                  begin={`indefinite`}
                  repeatCount="0"
                  fill="freeze"
                />

                {headShape.svgElem}
              </g>
            ) : null}
            {/* debug elements */}
            {_debug ? (
              <>
                {/* control points circles */}
                <circle r="5" cx={st.cpx1} cy={st.cpy1} fill="green" />
                <circle r="5" cx={st.cpx2} cy={st.cpy2} fill="blue" />
                {/* start to end rectangle wrapper */}
                <rect
                  x={st.excLeft}
                  y={st.excUp}
                  width={st.absDx}
                  height={st.absDy}
                  fill="none"
                  stroke="pink"
                  strokeWidth="2px"
                />
              </>
            ) : null}
          </svg>

          {labels.start ? (
            <div
              style={{
                transform: st.dx < 0 ? 'translate(-100% , -50%)' : 'translate(-0% , -50%)',
                width: 'max-content',
                position: 'absolute',
                left: st.cx0 + st.labelStartPos.x,
                top: st.cy0 + st.labelStartPos.y - strokeWidth - 5,
              }}>
              {labels.start}
            </div>
          ) : null}
          {labels.middle ? (
            <div
              style={{
                display: 'table',
                width: 'max-content',
                transform: 'translate(-50% , -50%)',
                position: 'absolute',
                left: st.cx0 + st.labelMiddlePos.x,
                top: st.cy0 + st.labelMiddlePos.y,
              }}>
              {labels.middle}
            </div>
          ) : null}
          {labels.end ? (
            <div
              style={{
                transform: st.dx > 0 ? 'translate(-100% , -50%)' : 'translate(-0% , -50%)',
                width: 'max-content',
                position: 'absolute',
                left: st.cx0 + st.labelEndPos.x,
                top: st.cy0 + st.labelEndPos.y + strokeWidth + 5,
              }}>
              {labels.end}
            </div>
          ) : null}
          {_debug ? (
            <>
              {/* possible anchor connections */}
              {[...st.startPoints, ...st.endPoints].map((p, i) => {
                return (
                  <div
                    key={i}
                    style={{
                      background: 'gray',
                      opacity: 0.5,
                      borderRadius: '50%',
                      transform: 'translate(-50%, -50%)',
                      height: 5,
                      width: 5,
                      position: 'absolute',
                      left: p.x - st.mainDivPos.x,
                      top: p.y - st.mainDivPos.y,
                    }}
                  />
                )
              })}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export default Xarrow
