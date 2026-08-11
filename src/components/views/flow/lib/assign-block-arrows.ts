import { processIoConnections } from '@/components/graph/fields/graph/flows/io/connection-definitions'
import { processTaskParallelConnections } from '@/components/graph/fields/graph/flows/parallel/connection-definitions'
import { processTaskConnections } from '@/components/graph/fields/graph/flows/task/connection-definitions'
import { processTestConnections } from '@/components/graph/fields/graph/flows/test/connection-definitions'
import { arrowStyle } from '@/components/graph/fields/graph/lib/arrow-style'
import { ProcessTaskCompoundBlock } from '@/components/views/flow/flow-block'

type AccumulatorItem = {
  arrows: ArrowType[]
  blockType: string
  id: string
  leftId: string
  rightId: string
}

type ArrowType = {
  color: string
  end: string
  originalArrow: {
    position: string
    type: string
  }
  // arrowStyle properties
  path: 'grid' | 'smooth' | 'straight'
  start: string
  strokeWidth: number
}

type ConnectionDefinition = {
  definitions: Record<string, unknown[]>
  options: readonly string[]
  position: string
}

type DefinitionsByPosition = Map<string, Record<string, unknown[]>>

type ReturnObject = {
  arrows: Array<{ position: string; type: string }>
  definitionsByPosition: DefinitionsByPosition
  id: string
  leftId: string
  rightId: string
}

type ReturnTuple = [ReturnObject | undefined, ReturnObject]

// Pre-index connection definitions by position for O(1) lookup instead of O(n) find()
const createDefinitionIndex = (connections: ConnectionDefinition[]): DefinitionsByPosition => {
  return new Map(connections.map((c) => [c.position, c.definitions]))
}

// Module-level cached indexes - created once at import time
const processIoDefinitionsByPosition = createDefinitionIndex(processIoConnections)
const processTaskDefinitionsByPosition = createDefinitionIndex(processTaskConnections)
const processTestDefinitionsByPosition = createDefinitionIndex(processTestConnections)
const processTaskParallelDefinitionsByPosition = createDefinitionIndex(
  processTaskParallelConnections,
)

export const assignBlockArrows = (block: ProcessTaskCompoundBlock) => {
  let blockLeft, blockRight

  const leftId = `${block.id}-left`
  const rightId = `${block.id}-right`

  switch (block.blockType) {
    case 'proc-task-io': {
      if (block.graph?.io?.enabled) {
        blockLeft = {
          arrows: block.graph?.io?.connections,
          definitionsByPosition: processIoDefinitionsByPosition,
          id: leftId,
          leftId,
          rightId,
        }
      }
      blockRight = {
        arrows: block.graph?.task?.connections,
        definitionsByPosition: processTaskDefinitionsByPosition,
        id: rightId,
        leftId,
        rightId,
      }
      break
    }
    case 'proc-task-p': {
      blockLeft = {
        arrows: block.graph?.task?.connections,
        definitionsByPosition: processTaskParallelDefinitionsByPosition,
        id: leftId,
        leftId,
        rightId,
      }
      blockRight = {
        arrows: block.graph?.task?.connections,
        definitionsByPosition: processTaskParallelDefinitionsByPosition,
        id: rightId,
        leftId,
        rightId,
      }
      break
    }
    case 'proc-test': {
      if (block.graph?.output?.enabled) {
        blockLeft = {
          arrows: block.graph?.output?.connections,
          definitionsByPosition: processIoDefinitionsByPosition,
          id: leftId,
          leftId,
          rightId,
        }
      }
      blockRight = {
        arrows: block.graph?.test?.connections,
        definitionsByPosition: processTestDefinitionsByPosition,
        id: rightId,
        leftId,
        rightId,
      }
      break
    }
    default: {
      throw new Error(`Block type not supported: ${(block as any).blockType}`)
    }
  }

  if (!blockRight) {
    throw new Error('Block right should not be undefined')
  }

  const result: ReturnTuple = [blockLeft as ReturnObject | undefined, blockRight as ReturnObject]
  const blockType = block.blockType

  return result.reduce<AccumulatorItem[]>((acc, block) => {
    // Skip iteration if the block is undefined
    if (!block) {
      return acc
    }

    const { arrows, definitionsByPosition, id, leftId, rightId } = block

    for (const arrow of arrows ?? []) {
      // O(1) Map lookup instead of O(n) array.find()
      const definitions = definitionsByPosition.get(arrow.position)
      if (!definitions) {
        continue
      }
      // Definitions are already flat arrays, no need for .flat()
      const arrowDefinitions = definitions[arrow.type]
      if (!arrowDefinitions || arrowDefinitions.length === 0) {
        continue
      }

      // Pre-merge arrowStyle here instead of spreading on every render
      const displayArrows = arrowDefinitions.map((a) => ({
        ...(a as Record<string, unknown>),
        ...arrowStyle,
        originalArrow: arrow,
      }))

      acc.push({ arrows: displayArrows as ArrowType[], blockType, id, leftId, rightId })
    }
    return acc
  }, [])
}
