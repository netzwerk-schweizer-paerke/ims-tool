import { processIoConnections } from '@/components/graph/fields/graph/flows/io/connection-definitions'
import { processTaskParallelConnections } from '@/components/graph/fields/graph/flows/parallel/connection-definitions'
import { processTaskConnections } from '@/components/graph/fields/graph/flows/task/connection-definitions'
import { processTestConnections } from '@/components/graph/fields/graph/flows/test/connection-definitions'
import { ArrowSpec } from '@/components/graph/fields/graph/lib/arrow-geometry'
import {
  ArrowDefinitions,
  ConnectionDefinition,
  isConnectionPosition,
  isConnectionType,
} from '@/components/graph/fields/graph/lib/connection-types'
import { ProcessTaskCompoundBlock } from '@/components/views/flow/flow-block'

/** One stored connection of one half of a compound block, resolved to its arrows. */
export type BlockArrows = {
  arrows: ArrowSpec[]
  blockType: string
  /** The stored values this entry came from. The parallel block reads them back. */
  connection: { position: string; type: string }
  id: string
  leftId: string
  rightId: string
}

type BlockHalf = {
  connections?: null | unknown[]
  definitionsByPosition: DefinitionsByPosition
  id: string
}

type DefinitionsByPosition = Map<string, ArrowDefinitions>

// Pre-index connection definitions by position for O(1) lookup instead of O(n) find()
const createDefinitionIndex = (
  connections: readonly ConnectionDefinition[],
): DefinitionsByPosition => new Map(connections.map((c) => [c.position, c.definitions]))

// Module-level cached indexes - created once at import time
const processIoDefinitionsByPosition = createDefinitionIndex(processIoConnections)
const processTaskDefinitionsByPosition = createDefinitionIndex(processTaskConnections)
const processTestDefinitionsByPosition = createDefinitionIndex(processTestConnections)
const processTaskParallelDefinitionsByPosition = createDefinitionIndex(
  processTaskParallelConnections,
)

const readConnection = (value: unknown) => {
  if (typeof value !== 'object' || value === null) return null
  const { position, type } = value as { position?: unknown; type?: unknown }
  if (!isConnectionPosition(position) || !isConnectionType(type)) return null
  return { position, type }
}

export const assignBlockArrows = (block: ProcessTaskCompoundBlock): BlockArrows[] => {
  const leftId = `${block.id}-left`
  const rightId = `${block.id}-right`

  let blockLeft: BlockHalf | undefined
  let blockRight: BlockHalf | undefined

  switch (block.blockType) {
    case 'proc-task-io': {
      if (block.graph?.io?.enabled) {
        blockLeft = {
          connections: block.graph?.io?.connections,
          definitionsByPosition: processIoDefinitionsByPosition,
          id: leftId,
        }
      }
      blockRight = {
        connections: block.graph?.task?.connections,
        definitionsByPosition: processTaskDefinitionsByPosition,
        id: rightId,
      }
      break
    }
    case 'proc-task-p': {
      blockLeft = {
        connections: block.graph?.task?.connections,
        definitionsByPosition: processTaskParallelDefinitionsByPosition,
        id: leftId,
      }
      blockRight = {
        connections: block.graph?.task?.connections,
        definitionsByPosition: processTaskParallelDefinitionsByPosition,
        id: rightId,
      }
      break
    }
    case 'proc-test': {
      if (block.graph?.output?.enabled) {
        blockLeft = {
          connections: block.graph?.output?.connections,
          definitionsByPosition: processIoDefinitionsByPosition,
          id: leftId,
        }
      }
      blockRight = {
        connections: block.graph?.test?.connections,
        definitionsByPosition: processTestDefinitionsByPosition,
        id: rightId,
      }
      break
    }
    default: {
      // Runs inside TaskFlowArrows' render — a block type added to the collection but not
      // yet mapped here must degrade to "no arrows", not blank the whole flow view.
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[graph] no arrow definitions for block type "${String((block as { blockType?: string }).blockType)}" — drawing no arrows`,
        )
      }
      return []
    }
  }

  const result: BlockArrows[] = []

  for (const half of [blockLeft, blockRight]) {
    if (!half) continue

    for (const stored of half.connections ?? []) {
      const connection = readConnection(stored)
      if (!connection) continue

      const definitions = half.definitionsByPosition.get(connection.position)
      const arrows = definitions?.[connection.type]
      if (!arrows?.length) continue

      result.push({
        arrows,
        blockType: block.blockType,
        connection,
        id: half.id,
        leftId,
        rightId,
      })
    }
  }

  return result
}
