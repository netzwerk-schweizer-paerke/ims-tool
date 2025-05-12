import React, { useEffect, useState } from 'react'

type PathType = 'direct' | 'vertical-horizontal' | 'horizontal-vertical'

interface ArrowConnectorProps {
  startId: string
  endId: string
  showArrowHead?: boolean
  pathType?: PathType
  stroke?: string
  strokeWidth?: number
}

const ArrowConnector: React.FC<ArrowConnectorProps> = ({
  startId,
  endId,
  showArrowHead = true,
  pathType = 'direct',
  stroke = 'black',
  strokeWidth = 2,
}) => {
  const [path, setPath] = useState('')

  const updatePath = () => {
    const startElem = document.getElementById(startId)
    const endElem = document.getElementById(endId)
    if (!startElem || !endElem) return

    const startRect = startElem.getBoundingClientRect()
    const endRect = endElem.getBoundingClientRect()

    const startX = startRect.left + startRect.width / 2
    const startY = startRect.top + startRect.height / 2
    const endX = endRect.left + endRect.width / 2
    const endY = endRect.top + endRect.height / 2

    let d = ''

    switch (pathType) {
      case 'vertical-horizontal':
        d = `M ${startX},${startY} L ${startX},${endY} L ${endX},${endY}`
        break
      case 'horizontal-vertical':
        d = `M ${startX},${startY} L ${endX},${startY} L ${endX},${endY}`
        break
      case 'direct':
      default:
        d = `M ${startX},${startY} L ${endX},${endY}`
    }

    setPath(d)
  }

  useEffect(() => {
    updatePath()
    window.addEventListener('resize', updatePath)
    window.addEventListener('scroll', updatePath, true)

    return () => {
      window.removeEventListener('resize', updatePath)
      window.removeEventListener('scroll', updatePath, true)
    }
  }, [])

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 999,
      }}>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
          markerUnits="strokeWidth">
          <polygon points="0 0, 10 3.5, 0 7" fill={stroke} />
        </marker>
      </defs>
      <path
        d={path}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
        markerEnd={showArrowHead ? 'url(#arrowhead)' : ''}
      />
    </svg>
  )
}

export default ArrowConnector
