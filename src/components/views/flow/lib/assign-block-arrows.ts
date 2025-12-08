import { ProcessTaskCompoundBlock } from '@/components/views/flow/flow-block'
import { processIoConnections } from '@/components/graph/fields/graph/flows/io/connection-definitions'
import { processTaskConnections } from '@/components/graph/fields/graph/flows/task/connection-definitions'
import { processTestConnections } from '@/components/graph/fields/graph/flows/test/connection-definitions'
import { processTaskParallelConnections } from '@/components/graph/fields/graph/flows/parallel/connection-definitions'
import { arrowStyle } from '@/components/graph/fields/graph/lib/arrow-style'

type ArrowType = {
  start: string
  end: string
  originalArrow: {
    position: string
    type: string
  }
  // arrowStyle properties
  path: 'smooth' | 'grid' | 'straight'
  color: string
  strokeWidth: number
}

type AccumulatorItem = {
  id: string
  arrows: ArrowType[]
  leftId: string
  rightId: string
  blockType: string
}

type ConnectionDefinition = {
  position: string
  options: readonly string[]
  definitions: Record<string, unknown[]>
}

type DefinitionsByPosition = Map<string, Record<string, unknown[]>>

type ReturnObject = {
  id: string
  arrows: Array<{ position: string; type: string }>
  definitionsByPosition: DefinitionsByPosition
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
    case 'proc-task-io':
      if (block.graph?.io?.enabled) {
        blockLeft = {
          id: leftId,
          arrows: block.graph?.io?.connections,
          definitionsByPosition: processIoDefinitionsByPosition,
          leftId,
          rightId,
        }
      }
      blockRight = {
        id: rightId,
        arrows: block.graph?.task?.connections,
        definitionsByPosition: processTaskDefinitionsByPosition,
        leftId,
        rightId,
      }
      break
    case 'proc-test':
      if (block.graph?.output?.enabled) {
        blockLeft = {
          id: leftId,
          arrows: block.graph?.output?.connections,
          definitionsByPosition: processIoDefinitionsByPosition,
          leftId,
          rightId,
        }
      }
      blockRight = {
        id: rightId,
        arrows: block.graph?.test?.connections,
        definitionsByPosition: processTestDefinitionsByPosition,
        leftId,
        rightId,
      }
      break
    case 'proc-task-p':
      blockLeft = {
        id: leftId,
        arrows: block.graph?.task?.connections,
        definitionsByPosition: processTaskParallelDefinitionsByPosition,
        leftId,
        rightId,
      }
      blockRight = {
        id: rightId,
        arrows: block.graph?.task?.connections,
        definitionsByPosition: processTaskParallelDefinitionsByPosition,
        leftId,
        rightId,
      }
      break
    default:
      throw new Error(`Block type not supported: ${(block as any).blockType}`)
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

    const { definitionsByPosition, arrows, id, leftId, rightId } = block

    arrows?.forEach((arrow) => {
      // O(1) Map lookup instead of O(n) array.find()
      const definitions = definitionsByPosition.get(arrow.position)
      if (!definitions) {
        return
      }
      // Definitions are already flat arrays, no need for .flat()
      const arrowDefinitions = definitions[arrow.type]
      if (!arrowDefinitions || arrowDefinitions.length === 0) {
        return
      }

      // Pre-merge arrowStyle here instead of spreading on every render
      const displayArrows = arrowDefinitions.map((a) => ({
        ...(a as Record<string, unknown>),
        ...arrowStyle,
        originalArrow: arrow,
      }))

      acc.push({ arrows: displayArrows as ArrowType[], id, leftId, rightId, blockType })
    })
    return acc
  }, [])
}
