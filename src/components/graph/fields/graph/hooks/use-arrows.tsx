'use client'
import { useCallback, useId, useMemo } from 'react'

import { LayerArrow } from '@/components/graph/fields/graph/lib/arrow-layer'
import {
  ConnectionDefinition,
  ConnectionPosition,
  ConnectionStateType,
  ConnectionType,
} from '@/components/graph/fields/graph/lib/connection-types'

type Props = {
  connections: readonly ConnectionDefinition[]
  setState: (state: ConnectionStateType) => void
  state?: ConnectionStateType
}

export const useArrows = ({ connections, setState, state }: Props) => {
  const arrowSetId = useId()

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
    },
    [state, setState],
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

  // Only the connections drive the arrows. The text lives in the same state object, and
  // `setValue` spreads that object on every keystroke while it keeps this array's identity.
  // A dependency on the whole state therefore rebuilt every arrow of the block on each keystroke.
  const stateConnections = state?.connections

  const arrows = useMemo<LayerArrow[]>(() => {
    if (!stateConnections) return []
    return stateConnections.flatMap((connection, connectionIndex) => {
      // The JSON schema only checks that position and type are strings, so stored
      // values that no longer exist in the definitions must be skipped — throwing
      // here would take down the whole edit view.
      const definitions = connections.find(
        (candidate) => candidate.position === connection.position,
      )?.definitions
      const specs = definitions?.[connection.type]
      if (!specs) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[graph] no arrow definition for "${connection.position}/${connection.type}" — skipping`,
          )
        }
        return []
      }
      return specs.map((spec, index) => ({
        ...spec,
        end: `${arrowSetId}-${spec.end}`,
        // Keyed by the endpoints rather than by the index alone, because the list changes
        // length as connection types change. The connection index keeps the key unique,
        // because nothing stops a block from storing the same position twice.
        key: `${connectionIndex}-${connection.position}-${spec.start}-${spec.end}-${index}`,
        start: `${arrowSetId}-${spec.start}`,
      }))
    })
  }, [stateConnections, connections, arrowSetId])

  return { arrows, arrowSetId, toggleConnectionType }
}
