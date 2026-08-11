'use client'
import { debounce } from 'es-toolkit'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { arrowStyle } from '@/components/graph/fields/graph/lib/arrow-style'
import Xarrow, { useXarrow } from '@/lib/xarrows/src'

export const connectionTypes = ['in', 'out', 'pass-by', 'in-bottom', 'out-top', 'none'] as const

export type ConnectionStateType = {
  connections: ConnectionsType
  text?: string
  textBottom?: string
  textLeft?: string
  textRight?: string
  textTop?: string
}

export type ConnectionsType = {
  position: 'bottom' | 'left' | 'right' | 'top'
  type: (typeof connectionTypes)[number]
}[]

type ArrowConnections = {
  definitions: Record<string, any[]>
  options: readonly string[]
  position: string
}[]

type Props = {
  connections: ArrowConnections
  setState: any
  state?: ConnectionStateType
}

export const useArrows = ({ connections, setState, state }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const arrowSetId = useId()
  const updateXarrow = useXarrow()
  const [isLoaded, setIsLoaded] = useState(false)

  const setConnectionType = (type: string, position: string) => {
    const connection = state?.connections.find((connection) => connection.position === position)
    if (!connection) {
      throw new Error(`No connection found for arrow position: ${position}`)
    }
    const connections = state?.connections.map((connection) => {
      if (connection.position === position) {
        return { ...connection, type }
      }
      return connection
    })

    setState({
      ...state,
      connections,
    })
    updateXarrow()
  }

  const toggleConnectionType = (position: string) => {
    const options = connections.find((connection) => connection.position === position)?.options
    if (!options) {
      throw new Error(`No options found for arrow position: ${position}`)
    }
    const option = options.find(
      (option) =>
        option === state?.connections.find((connection) => connection.position === position)?.type,
    )
    if (!option) {
      throw new Error(`No options found for arrow position: ${position}`)
    }
    const currentIndex = options.indexOf(option)
    if (currentIndex === -1) {
      setConnectionType(options[0], position)
      return
    }
    const nextIndex = currentIndex + 1
    if (options[nextIndex]) {
      setConnectionType(options[nextIndex], position)
    } else {
      setConnectionType(options[0], position)
    }
  }

  useEffect(() => {
    const reference = ref.current
    if (!reference) return

    const handleResize = debounce(() => {
      setIsLoaded(true)
      updateXarrow()
    }, 250)

    const resizeObserver = new ResizeObserver(handleResize)

    if (reference) {
      resizeObserver.observe(reference)
    }

    // Clean up function
    return () => {
      if (reference) {
        resizeObserver.unobserve(reference)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderArrows = useCallback(() => {
    if (!state?.connections) return null
    return state.connections
      .flatMap((connection) => {
        const definition = connections.find((c) => c.position === connection.position)?.definitions
        if (!definition) {
          throw new Error(`No definition found for arrow position: ${connection.position}`)
        }
        return definition[connection.type]
      })
      .map((arrow, index) => {
        if (!arrow) return null
        const start = `${arrowSetId}-${arrow.start}`
        const end = `${arrowSetId}-${arrow.end}`
        const props = { ...arrow, end, start, ...arrowStyle }
        return <Xarrow key={index} {...props} />
      })
  }, [state, connections, arrowSetId])

  return { arrowSetId, isLoaded, ref, renderArrows, toggleConnectionType, updateXarrow }
}
