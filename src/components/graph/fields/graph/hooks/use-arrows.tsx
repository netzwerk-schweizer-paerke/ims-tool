'use client'
import { debounce } from 'es-toolkit'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { arrowStyle } from '@/components/graph/fields/graph/lib/arrow-style'
import {
  ConnectionDefinition,
  ConnectionPosition,
  ConnectionStateType,
  ConnectionType,
} from '@/components/graph/fields/graph/lib/connection-types'
import Xarrow, { useXarrow } from '@/lib/xarrows/src'

type Props = {
  connections: readonly ConnectionDefinition[]
  setState: (state: ConnectionStateType) => void
  state?: ConnectionStateType
}

export const useArrows = ({ connections, setState, state }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const arrowSetId = useId()
  const updateXarrow = useXarrow()
  const [isLoaded, setIsLoaded] = useState(false)

  const setConnectionType = useCallback(
    (type: ConnectionType, position: ConnectionPosition) => {
      if (!state) return

      // A stored state that predates this position simply has no entry for it yet —
      // add one rather than refusing to switch the connection.
      const hasPosition = state.connections.some((connection) => connection.position === position)
      const nextConnections = hasPosition
        ? state.connections.map((connection) =>
            connection.position === position ? { ...connection, type } : connection,
          )
        : [...state.connections, { position, type }]

      setState({
        ...state,
        connections: nextConnections,
      })
      updateXarrow()
    },
    [state, setState, updateXarrow],
  )

  // Memoised so the memo()'d node buttons only re-render when the block's own value
  // changes, not on every resize- or arrow-driven render of the field.
  const toggleConnectionType = useCallback(
    (position: ConnectionPosition) => {
      const options = connections.find((connection) => connection.position === position)?.options
      if (!options?.length) return

      const current = state?.connections.find(
        (connection) => connection.position === position,
      )?.type
      // A missing or no-longer-supported stored type restarts the cycle at the first option.
      const currentIndex = current ? options.indexOf(current) : -1
      setConnectionType(options[(currentIndex + 1) % options.length], position)
    },
    [connections, state, setConnectionType],
  )

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
        // The JSON schema only checks that position and type are strings, so stored
        // values that no longer exist in the definitions must be skipped — throwing
        // here would take down the whole edit view.
        const definitions = connections.find(
          (candidate) => candidate.position === connection.position,
        )?.definitions
        const arrows = definitions?.[connection.type]
        if (!arrows) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `[graph] no arrow definition for "${connection.position}/${connection.type}" — skipping`,
            )
          }
          return []
        }
        return arrows.map((arrow, arrowIndex) => ({
          arrow,
          // Keyed by the endpoints, deliberately NOT by connection.type. Xarrow holds
          // position state, so a bare index would let React reuse one instance for a
          // different start/end pair — but including the type would force a remount on
          // every switch, and a remount costs ~4 render passes and several forced layout
          // reads before the arrow is visible again. Endpoints give both: stable identity
          // when the geometry is unchanged, a fresh instance when it genuinely differs.
          key: `${connection.position}-${arrow.start}-${arrow.end}-${arrowIndex}`,
        }))
      })
      .map(({ arrow, key }) => {
        const start = `${arrowSetId}-${arrow.start}`
        const end = `${arrowSetId}-${arrow.end}`
        const props = { ...arrow, end, start, ...arrowStyle }
        return <Xarrow key={key} {...props} />
      })
  }, [state, connections, arrowSetId])

  return { arrowSetId, isLoaded, ref, renderArrows, toggleConnectionType, updateXarrow }
}
